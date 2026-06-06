import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class DeepSeekAdapter extends BaseAdapter {
  id = 'deepseek' as const;
  name = 'DeepSeek';
  hostPattern = '*://chat.deepseek.com/*';
  defaultUrl = 'https://chat.deepseek.com/';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;
}

export function registerDeepSeekContentScript(adapter = new DeepSeekAdapter()): void {
  registerAdapterContentScript('deepseek', 'DeepSeek', adapter);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerDeepSeekContentScript();
}
