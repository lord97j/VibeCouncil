import { BaseAdapter } from '@/adapters/base';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class ChatGPTAdapter extends BaseAdapter {
  id = 'chatgpt' as const;
  name = 'ChatGPT';
  hostPattern = '*://chatgpt.com/*';
  defaultUrl = 'https://chatgpt.com';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;

  getSelectors(): AdapterSelectors {
    return this.selectors;
  }
}

export function registerChatGPTContentScript(adapter = new ChatGPTAdapter()): void {
  console.log('[VibeCouncil] ChatGPT content script loaded');
  let activeRequestId = 0;

  // Check ready status on load
  adapter.isReady().then(ready => {
    console.log('[VibeCouncil] ChatGPT adapter ready:', ready);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[VibeCouncil] ChatGPT received message:', message.type, message.adapterId);

    if (message.type === 'PING') {
      sendResponse({ type: 'PONG', adapterId: 'chatgpt' });
      return false;
    }

    if (message.type === 'SEND_PROMPT' && message.adapterId === 'chatgpt') {
      const requestId = ++activeRequestId;
      let promptAcknowledged = false;
      console.log('[VibeCouncil] ChatGPT sending prompt:', message.prompt.substring(0, 80) + '...');
      adapter.sendPrompt(message.prompt)
        .then(() => {
          console.log('[VibeCouncil] ChatGPT prompt sent successfully');
          promptAcknowledged = true;
          sendResponse({ type: 'PROMPT_SENT', adapterId: 'chatgpt' });
          return adapter.waitForResponse();
        })
        .then(fullText => {
          if (requestId !== activeRequestId) return;
          chrome.runtime.sendMessage({
            type: 'RESPONSE_DONE',
            adapterId: 'chatgpt',
            fullText,
          }).catch(() => {});
        })
        .catch(err => {
          if (requestId !== activeRequestId) return;
          console.error('[VibeCouncil] ChatGPT prompt failed:', err);
          const error = err instanceof Error ? err.message : String(err);
          if (!promptAcknowledged) {
            sendResponse({ type: 'RESPONSE_FAILED', adapterId: 'chatgpt', error });
            return;
          }
          chrome.runtime.sendMessage({
            type: 'RESPONSE_FAILED',
            adapterId: 'chatgpt',
            error,
          }).catch(() => {});
        });
      return true;
    }

    if (message.type === 'CHECK_STATUS' && message.adapterId === 'chatgpt') {
      adapter.isReady().then(ready =>
        sendResponse({ type: 'ADAPTER_STATUS', adapterId: 'chatgpt', ready })
      );
      return true;
    }
  });
}

// Content script entry: listen for messages and observe DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerChatGPTContentScript();
}
