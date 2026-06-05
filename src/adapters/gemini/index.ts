import { BaseAdapter } from '@/adapters/base';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class GeminiAdapter extends BaseAdapter {
  id = 'gemini' as const;
  name = 'Gemini';
  hostPattern = '*://gemini.google.com/*';
  defaultUrl = 'https://gemini.google.com/app';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;

  getSelectors(): AdapterSelectors {
    return this.selectors;
  }
}

export function registerGeminiContentScript(adapter = new GeminiAdapter()): void {
  console.log('[VibeCouncil] Gemini content script loaded');
  let activeRequestId = 0;

  adapter.isReady().then(ready => {
    console.log('[VibeCouncil] Gemini adapter ready:', ready);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[VibeCouncil] Gemini received message:', message.type, message.adapterId);

    if (message.type === 'PING') {
      sendResponse({ type: 'PONG', adapterId: 'gemini' });
      return false;
    }

    if (message.type === 'SEND_PROMPT' && message.adapterId === 'gemini') {
      const requestId = ++activeRequestId;
      let promptAcknowledged = false;
      console.log('[VibeCouncil] Gemini sending prompt:', message.prompt.substring(0, 80) + '...');
      adapter.sendPrompt(message.prompt)
        .then(() => {
          console.log('[VibeCouncil] Gemini prompt sent successfully');
          promptAcknowledged = true;
          sendResponse({ type: 'PROMPT_SENT', adapterId: 'gemini' });
          return adapter.waitForResponse();
        })
        .then(fullText => {
          if (requestId !== activeRequestId) return;
          chrome.runtime.sendMessage({
            type: 'RESPONSE_DONE',
            adapterId: 'gemini',
            fullText,
          }).catch(() => {});
        })
        .catch(err => {
          if (requestId !== activeRequestId) return;
          console.error('[VibeCouncil] Gemini prompt failed:', err);
          const error = err instanceof Error ? err.message : String(err);
          if (!promptAcknowledged) {
            sendResponse({ type: 'RESPONSE_FAILED', adapterId: 'gemini', error });
            return;
          }
          chrome.runtime.sendMessage({
            type: 'RESPONSE_FAILED',
            adapterId: 'gemini',
            error,
          }).catch(() => {});
        });
      return true;
    }

    if (message.type === 'CHECK_STATUS' && message.adapterId === 'gemini') {
      adapter.isReady().then(ready =>
        sendResponse({ type: 'ADAPTER_STATUS', adapterId: 'gemini', ready })
      );
      return true;
    }
  });
}

// Content script entry: listen for messages and observe DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerGeminiContentScript();
}
