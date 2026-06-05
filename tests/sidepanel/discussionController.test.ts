import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { registerBuiltinStrategies, strategyRegistry } from '@/strategies';
import { DiscussionController } from '@/sidepanel/store/discussionController';
import type { DiscussionConfig, DiscussionState } from '@/types';

const config: DiscussionConfig = {
  rounds: 1,
  strategyId: 'parallel',
  judgeAdapterId: 'chatgpt',
  promptStyle: 'neutral',
  participantIds: ['chatgpt'],
};

describe('DiscussionController', () => {
  let updates: DiscussionState[];
  let completed: DiscussionState[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    strategyRegistry.clear();
    registerBuiltinStrategies();
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42, status: 'complete' });
    (chrome.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    updates = [];
    completed = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reloads a tab and retries when the content script is missing', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 42, url: 'https://chatgpt.com/' },
    ]);
    (chrome.tabs.reload as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockResolvedValueOnce({ type: 'PONG', adapterId: 'chatgpt' })
      .mockResolvedValueOnce({ type: 'PROMPT_SENT', adapterId: 'chatgpt' });

    const controller = new DiscussionController(
      state => updates.push(state),
      state => completed.push(state),
    );

    const started = controller.start('test question', config);
    await vi.runAllTimersAsync();
    await started;

    expect(chrome.tabs.reload).toHaveBeenCalledWith(42);
    expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(
      42,
      expect.objectContaining({
        type: 'SEND_PROMPT',
        adapterId: 'chatgpt',
      }),
    );
    expect(updates.at(-1)?.status).toBe('dispatching');
    expect(completed).toHaveLength(0);
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('records a failed response when reload cannot restore the content script', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 42, url: 'https://chatgpt.com/' },
    ]);
    (chrome.tabs.reload as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Receiving end does not exist'),
    );

    const controller = new DiscussionController(
      state => updates.push(state),
      state => completed.push(state),
    );

    const started = controller.start('test question', config);
    await vi.runAllTimersAsync();
    await started;

    const finalState = completed.at(-1);
    expect(chrome.tabs.reload).toHaveBeenCalledWith(42);
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ['assets/chatgpt-loader.js'],
    });
    expect(finalState?.status).toBe('failed');
    expect(finalState?.rounds[0]?.responses[0]).toEqual(
      expect.objectContaining({
        adapterId: 'chatgpt',
        status: 'failed',
      }),
    );
  });
});
