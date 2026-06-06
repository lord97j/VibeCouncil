import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class DoubaoAdapter extends BaseAdapter {
  id = 'doubao' as const;
  name = '豆包';
  hostPattern = '*://www.doubao.com/*';
  defaultUrl = 'https://www.doubao.com/chat';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;
}

export function registerDoubaoContentScript(adapter = new DoubaoAdapter()): void {
  registerAdapterContentScript('doubao', '豆包', adapter);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerDoubaoContentScript();
}
