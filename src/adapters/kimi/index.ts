import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class KimiAdapter extends BaseAdapter {
  id = 'kimi' as const;
  name = 'Kimi';
  hostPattern = '*://www.kimi.com/*';
  defaultUrl = 'https://www.kimi.com/zh';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;
}

export function registerKimiContentScript(adapter = new KimiAdapter()): void {
  registerAdapterContentScript('kimi', 'Kimi', adapter);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerKimiContentScript();
}
