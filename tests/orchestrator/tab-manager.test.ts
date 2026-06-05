import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabManager } from '@/orchestrator/tab-manager';
import type { AIPlatformAdapter } from '@/types';

function mockAdapter(id: string, host: string, url: string): AIPlatformAdapter {
  return { id, name: id, hostPattern: host, defaultUrl: url } as AIPlatformAdapter;
}

describe('TabManager', () => {
  let manager: TabManager;

  beforeEach(() => {
    manager = new TabManager();
    vi.clearAllMocks();
  });

  it('finds open tabs for registered adapters', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, url: 'https://chatgpt.com/chat' },
      { id: 2, url: 'https://gemini.google.com/app' },
    ]);

    const adapters = [
      mockAdapter('chatgpt', '*://chatgpt.com/*', 'https://chatgpt.com'),
      mockAdapter('gemini', '*://gemini.google.com/*', 'https://gemini.google.com/app'),
    ];

    const tabs = await manager.findAdapterTabs(adapters);
    expect(tabs.get('chatgpt')?.id).toBe(1);
    expect(tabs.get('gemini')?.id).toBe(2);
  });

  it('returns empty map when no tabs found', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const tabs = await manager.findAdapterTabs([
      mockAdapter('chatgpt', '*://chatgpt.com/*', 'https://chatgpt.com'),
    ]);
    expect(tabs.size).toBe(0);
  });

  it('opens a new tab for an adapter', async () => {
    const adapter = mockAdapter('gemini', '*://gemini.google.com/*', 'https://gemini.google.com/app');
    await manager.openPlatformTab(adapter);
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://gemini.google.com/app',
      active: false,
    });
  });
});
