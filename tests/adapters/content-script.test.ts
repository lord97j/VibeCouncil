import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIPlatformAdapter } from '@/types';

function fakeAdapter(overrides: Partial<AIPlatformAdapter> = {}): AIPlatformAdapter {
  return {
    id: 'chatgpt',
    name: 'ChatGPT',
    hostPattern: '*://chatgpt.com/*',
    defaultUrl: 'https://chatgpt.com',
    sendPrompt: vi.fn().mockResolvedValue(undefined),
    waitForResponse: vi.fn().mockResolvedValue('final answer'),
    isReady: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

async function settlePromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('adapter content scripts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('responds to ping messages', async () => {
    const { registerChatGPTContentScript } = await import('@/adapters/chatgpt');
    vi.clearAllMocks();

    registerChatGPTContentScript(fakeAdapter());
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const sendResponse = vi.fn();

    const keepAlive = listener({ type: 'PING' }, {}, sendResponse);

    expect(keepAlive).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ type: 'PONG', adapterId: 'chatgpt' });
  });

  it('acknowledges a sent prompt and emits a completed ChatGPT response', async () => {
    const adapter = fakeAdapter();
    const { registerChatGPTContentScript } = await import('@/adapters/chatgpt');
    vi.clearAllMocks();

    registerChatGPTContentScript(adapter);
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const sendResponse = vi.fn();

    const keepAlive = listener(
      { type: 'SEND_PROMPT', adapterId: 'chatgpt', prompt: 'hello' },
      {},
      sendResponse,
    );
    await settlePromises();

    expect(keepAlive).toBe(true);
    expect(adapter.sendPrompt).toHaveBeenCalledWith('hello');
    expect(sendResponse).toHaveBeenCalledWith({ type: 'PROMPT_SENT', adapterId: 'chatgpt' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'RESPONSE_DONE',
      adapterId: 'chatgpt',
      fullText: 'final answer',
    });
  });

  it('emits a Gemini failure when response waiting fails after prompt send', async () => {
    const adapter = fakeAdapter({
      id: 'gemini',
      name: 'Gemini',
      waitForResponse: vi.fn().mockRejectedValue(new Error('response timeout')),
    });
    const { registerGeminiContentScript } = await import('@/adapters/gemini');
    vi.clearAllMocks();

    registerGeminiContentScript(adapter);
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const sendResponse = vi.fn();

    listener(
      { type: 'SEND_PROMPT', adapterId: 'gemini', prompt: 'hello' },
      {},
      sendResponse,
    );
    await settlePromises();

    expect(sendResponse).toHaveBeenCalledWith({ type: 'PROMPT_SENT', adapterId: 'gemini' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'RESPONSE_FAILED',
      adapterId: 'gemini',
      error: 'response timeout',
    });
  });
});
