import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
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
  registerAdapterContentScript('gemini', 'Gemini', adapter);
}

// Content script entry: listen for messages and observe DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerGeminiContentScript();
}
