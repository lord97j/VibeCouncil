import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
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
  registerAdapterContentScript('chatgpt', 'ChatGPT', adapter);
}

// Content script entry: listen for messages and observe DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerChatGPTContentScript();
}
