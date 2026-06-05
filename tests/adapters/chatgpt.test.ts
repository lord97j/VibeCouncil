import { describe, it, expect, beforeEach } from 'vitest';
import { ChatGPTAdapter } from '@/adapters/chatgpt';
import selectors from '@/adapters/chatgpt/selectors.json';

describe('ChatGPTAdapter', () => {
  let adapter: ChatGPTAdapter;

  beforeEach(() => {
    adapter = new ChatGPTAdapter();
    document.body.innerHTML = '';
  });

  it('has correct metadata', () => {
    expect(adapter.id).toBe('chatgpt');
    expect(adapter.name).toBe('ChatGPT');
    expect(adapter.hostPattern).toContain('chatgpt.com');
  });

  it('loads selectors from JSON config', () => {
    expect(adapter.getSelectors()).toEqual(selectors);
  });

  it('detects ready state when all elements exist', async () => {
    document.body.innerHTML = `
      <div id="prompt-textarea" contenteditable="true"></div>
      <nav aria-label="Chat history"></nav>
    `;
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects not ready when elements missing', async () => {
    document.body.innerHTML = '<div>empty</div>';
    expect(await adapter.isReady()).toBe(false);
  });
});
