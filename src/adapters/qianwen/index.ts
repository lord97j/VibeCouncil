import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class QianwenAdapter extends BaseAdapter {
  id = 'qianwen' as const;
  name = '千问';
  hostPattern = '*://www.qianwen.com/*';
  defaultUrl = 'https://www.qianwen.com/';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;
}

export function registerQianwenContentScript(adapter = new QianwenAdapter()): void {
  registerAdapterContentScript('qianwen', '千问', adapter);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerQianwenContentScript();
}
