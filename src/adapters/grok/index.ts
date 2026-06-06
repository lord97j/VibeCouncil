import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class GrokAdapter extends BaseAdapter {
  id = 'grok' as const;
  name = 'Grok';
  hostPattern = '*://grok.com/*';
  defaultUrl = 'https://grok.com/?q=&reasoningMode=none&voice=false';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;
}

export function registerGrokContentScript(adapter = new GrokAdapter()): void {
  registerAdapterContentScript('grok', 'Grok', adapter);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerGrokContentScript();
}
