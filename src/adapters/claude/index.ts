import { BaseAdapter } from '@/adapters/base';
import { registerAdapterContentScript } from '@/adapters/registerContentScript';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class ClaudeAdapter extends BaseAdapter {
  id = 'claude' as const;
  name = 'Claude';
  hostPattern = '*://claude.ai/*';
  defaultUrl = 'https://claude.ai/new';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;
}

export function registerClaudeContentScript(adapter = new ClaudeAdapter()): void {
  registerAdapterContentScript('claude', 'Claude', adapter);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  registerClaudeContentScript();
}
