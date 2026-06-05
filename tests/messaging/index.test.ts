import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToContentScript, broadcastToSidePanel, onMessage } from '@/messaging';
import type { ExtensionMessage } from '@/types';

describe('messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendToContentScript', () => {
    it('sends message to a specific tab', async () => {
      const tabId = 42;
      const message: ExtensionMessage = {
        type: 'SEND_PROMPT',
        adapterId: 'chatgpt',
        prompt: 'Hello',
      };
      (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      await sendToContentScript(tabId, message);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });
  });

  describe('broadcastToSidePanel', () => {
    it('sends message via chrome.runtime.sendMessage', async () => {
      const message: ExtensionMessage = {
        type: 'RESPONSE_DONE',
        adapterId: 'chatgpt',
        fullText: 'Hello back',
      };
      (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await broadcastToSidePanel(message);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('onMessage', () => {
    it('registers a listener for specific message types', () => {
      const handler = vi.fn();
      onMessage('RESPONSE_DONE', handler);

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];

      listener({ type: 'RESPONSE_DONE', adapterId: 'chatgpt', fullText: 'test' }, {}, vi.fn());
      expect(handler).toHaveBeenCalled();
    });

    it('does not call handler for non-matching message types', () => {
      const handler = vi.fn();
      onMessage('RESPONSE_DONE', handler);

      const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
      listener({ type: 'SEND_PROMPT', adapterId: 'chatgpt', prompt: 'test' }, {}, vi.fn());
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
