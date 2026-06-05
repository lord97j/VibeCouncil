import type {
  DiscussionConfig,
  DiscussionState,
  RoundAction,
  ExtensionMessage,
} from '@/types';
import { strategyRegistry } from '@/strategies';
import { Orchestrator } from '@/orchestrator/state-machine';
import { TabManager } from '@/orchestrator/tab-manager';
import { sendPromptToAdapter } from '@/messaging';

/**
 * Controller that bridges the UI (Zustand store) with the Orchestrator
 * and Chrome messaging APIs. This is the only module that actually
 * sends prompts to content scripts and listens for responses.
 */
export class DiscussionController {
  private orchestrator: Orchestrator | null = null;
  private tabManager = new TabManager();
  private onUpdate: (state: DiscussionState) => void;
  private onComplete: (state: DiscussionState) => void;

  constructor(
    onUpdate: (state: DiscussionState) => void,
    onComplete: (state: DiscussionState) => void,
  ) {
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;

    // Listen for responses from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }

  /**
   * Start a new discussion. Finds tabs, verifies content scripts, sends initial prompts.
   */
  async start(question: string, config: DiscussionConfig): Promise<void> {
    const strategy = strategyRegistry.get(config.strategyId);
    if (!strategy) {
      throw new Error(`Strategy "${config.strategyId}" not found`);
    }

    console.log('[VibeCouncil] Starting discussion:', question.substring(0, 60) + '...', 'strategy:', config.strategyId);

    this.orchestrator = new Orchestrator(question, config, strategy);

    // Start the state machine
    const actions = this.orchestrator.start();
    console.log('[VibeCouncil] Orchestrator started, actions:', actions.length);
    this.notifyUpdate();

    // Find tabs for all participants
    const adapters = config.participantIds.map(id => ({
      id,
      name: id,
      hostPattern: '',
      defaultUrl: id === 'chatgpt' ? 'https://chatgpt.com' : 'https://gemini.google.com/app',
      sendPrompt: async () => {},
      waitForResponse: async () => '',
      isReady: async () => false,
    }));

    const tabs = await this.tabManager.findAdapterTabs(adapters);
    console.log('[VibeCouncil] Found tabs:', [...tabs.entries()].map(([id, t]) => `${id}=${t.id}`).join(', '));

    // Send prompts to each adapter
    await this.sendActions(actions, tabs);
  }

  /**
   * Verify a content script is alive, reloading the tab once when Chrome
   * reports the extension has no listener in that page yet.
   */
  private async ensureContentScriptReady(adapterId: string, tabId: number): Promise<void> {
    try {
      await this.pingTab(tabId);
      console.log('[VibeCouncil] Ping OK for:', adapterId);
      return;
    } catch (err) {
      console.warn('[VibeCouncil] Initial ping failed for:', adapterId, err);
    }

    await this.reloadTab(tabId);
    await this.waitForTabComplete(tabId);

    try {
      await this.pingTab(tabId, 4, 500, 2500);
      console.log('[VibeCouncil] Ping OK after reload for:', adapterId);
      return;
    } catch (err) {
      console.warn('[VibeCouncil] Ping failed after reload for:', adapterId, err);
    }

    await this.injectContentScript(adapterId, tabId);
    await this.pingTab(tabId, 8, 500, 2500);
    console.log('[VibeCouncil] Ping OK after manual injection for:', adapterId);
  }

  /**
   * Send a lightweight ping to a tab and wait for a response.
   * Retries a few times to handle the race condition where the
   * content script's async dynamic import hasn't completed yet.
   */
  private async pingTab(
    tabId: number,
    retries = 4,
    intervalMs = 250,
    timeoutMs = 1500,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Ping timed out'));
          }, timeoutMs);

          chrome.tabs.sendMessage(tabId, { type: 'PING' })
            .then(() => { clearTimeout(timer); resolve(); })
            .catch((err) => { clearTimeout(timer); reject(err); });
        });
        return; // Success
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }
  }

  private async reloadTab(tabId: number): Promise<void> {
    console.log('[VibeCouncil] Reloading tab to inject content script:', tabId);
    await chrome.tabs.reload(tabId);
  }

  private async waitForTabComplete(
    tabId: number,
    retries = 40,
    intervalMs = 500,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') return;
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  private async injectContentScript(adapterId: string, tabId: number): Promise<void> {
    const files = this.getContentScriptFiles(adapterId);
    if (files.length === 0) {
      throw new Error(`Content script files for ${adapterId} not found in manifest`);
    }

    console.log('[VibeCouncil] Injecting content script for:', adapterId, files.join(', '));
    await chrome.scripting.executeScript({
      target: { tabId },
      files,
    });
  }

  private getContentScriptFiles(adapterId: string): string[] {
    const host = adapterId === 'chatgpt' ? 'chatgpt.com' : 'gemini.google.com';
    const scripts = chrome.runtime.getManifest().content_scripts ?? [];
    const entry = scripts.find(script =>
      script.matches?.some(match => match.includes(host))
    );
    return entry?.js ?? [];
  }

  /**
   * Handle incoming messages from content scripts.
   */
  private handleMessage = (message: ExtensionMessage, _sender: chrome.runtime.MessageSender) => {
    if (!this.orchestrator) return;

    if (message.type === 'RESPONSE_DONE') {
      this.orchestrator.recordResponse(
        message.adapterId,
        'completed',
        message.fullText,
      );
      this.notifyUpdate();
      this.checkAdvanceRound();
    }

    if (message.type === 'RESPONSE_CHUNK') {
      // Stream partial updates to UI
      const state = this.orchestrator.getState();
      const round = state.rounds[state.currentRoundIndex];
      if (round) {
        const response = round.responses.find(r => r.adapterId === message.adapterId);
        if (response) {
          response.content += message.chunk;
          response.status = 'streaming';
          this.notifyUpdate();
        }
      }
    }

    if (message.type === 'RESPONSE_FAILED') {
      this.orchestrator.recordResponse(
        message.adapterId,
        'failed',
        '',
        message.error,
      );
      this.notifyUpdate();
      this.checkAdvanceRound();
    }
  };

  /**
   * After recording a response, check if the round is complete
   * and advance if so.
   */
  private async checkAdvanceRound(): Promise<void> {
    if (!this.orchestrator) return;

    const state = this.orchestrator.getState();
    if (state.status === 'done' || state.status === 'failed') {
      this.onComplete(state);
      this.cleanup();
      return;
    }

    const currentRound = state.rounds[state.currentRoundIndex];
    if (!currentRound) return;

    const expectedCount = currentRound.type === 'judge'
      ? 1
      : state.config.participantIds.length;

    const completed = currentRound.responses.filter(
      r => r.status === 'completed' || r.status === 'failed'
    );

    if (completed.length >= expectedCount) {
      // Round complete — advance
      const nextActions = this.orchestrator.advanceToNextRound();
      this.notifyUpdate();

      const newState = this.orchestrator.getState();
      if (newState.status === 'done' || newState.status === 'failed') {
        this.onComplete(newState);
        this.cleanup();
        return;
      }

      // Send next round's prompts
      if (nextActions.length > 0) {
        const adapters = state.config.participantIds.map(id => ({
          id,
          name: id,
          hostPattern: '',
          defaultUrl: id === 'chatgpt' ? 'https://chatgpt.com' : 'https://gemini.google.com/app',
          sendPrompt: async () => {},
          waitForResponse: async () => '',
          isReady: async () => false,
        }));
        const tabs = await this.tabManager.findAdapterTabs(adapters);
        await this.sendActions(nextActions, tabs);
      }
    }
  }

  /**
   * Send a list of actions (prompts) to the appropriate tabs.
   */
  private async sendActions(
    actions: RoundAction[],
    tabs: Map<string, chrome.tabs.Tab>,
  ): Promise<void> {
    console.log('[VibeCouncil] sendActions:', actions.map(a => `${a.adapterId} (${a.roundType})`).join(', '));
    for (const action of actions) {
      const tab = tabs.get(action.adapterId);
      if (!tab?.id) {
        console.warn('[VibeCouncil] Tab not found for:', action.adapterId);
        this.orchestrator?.recordResponse(
          action.adapterId,
          'failed',
          '',
          `Tab for ${action.adapterId} not found. Please open ${action.adapterId === 'chatgpt' ? 'chatgpt.com' : 'gemini.google.com'} first.`,
        );
        this.notifyUpdate();
        this.checkAdvanceRound();
        continue;
      }

      try {
        await this.ensureContentScriptReady(action.adapterId, tab.id);
        console.log('[VibeCouncil] Sending prompt to:', action.adapterId, 'tabId:', tab.id);
        await sendPromptToAdapter(tab.id, action.adapterId, action.prompt);
        console.log('[VibeCouncil] Prompt sent OK to:', action.adapterId);
      } catch (err) {
        console.error('[VibeCouncil] Send FAILED for:', action.adapterId, err);
        this.orchestrator?.recordResponse(
          action.adapterId,
          'failed',
          '',
          `无法连接到 ${action.adapterId} 的内容脚本。请刷新 ${action.adapterId === 'chatgpt' ? 'chatgpt.com' : 'gemini.google.com'} 页面后重试。`,
        );
        this.notifyUpdate();
        this.checkAdvanceRound();
      }
    }
  }

  private notifyUpdate(): void {
    if (this.orchestrator) {
      this.onUpdate(this.orchestrator.getState());
    }
  }

  /**
   * Stop listening for messages and clean up.
   */
  cleanup(): void {
    chrome.runtime.onMessage.removeListener(this.handleMessage);
  }
}
