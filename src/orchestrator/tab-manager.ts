import type { AIPlatformAdapter } from '@/types';
import { getPlatform, urlMatchesPlatform } from '@/platforms';

export class TabManager {
  /**
   * Find currently open tabs that match any of the registered adapters.
   */
  async findAdapterTabs(
    adapters: AIPlatformAdapter[],
  ): Promise<Map<string, chrome.tabs.Tab>> {
    const allTabs = await chrome.tabs.query({});
    const result = new Map<string, chrome.tabs.Tab>();

    for (const adapter of adapters) {
      const matched = allTabs.find(tab => {
        const platform = getPlatform(adapter.id);
        if (platform) return urlMatchesPlatform(tab.url, platform);
        return tab.url?.includes(adapter.id) ?? false;
      });
      if (matched) {
        result.set(adapter.id, matched);
      }
    }

    return result;
  }

  /**
   * Open a new background tab for the given adapter.
   */
  async openPlatformTab(adapter: AIPlatformAdapter): Promise<chrome.tabs.Tab> {
    return chrome.tabs.create({
      url: adapter.defaultUrl,
      active: false,
    });
  }

  /**
   * Open tabs for all adapters not yet present.
   */
  async ensureAllTabsOpen(
    adapters: AIPlatformAdapter[],
  ): Promise<Map<string, chrome.tabs.Tab>> {
    const existing = await this.findAdapterTabs(adapters);
    for (const adapter of adapters) {
      if (!existing.has(adapter.id)) {
        const tab = await this.openPlatformTab(adapter);
        existing.set(adapter.id, tab);
      }
    }
    return existing;
  }
}
