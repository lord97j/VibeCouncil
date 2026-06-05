import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiAdapter } from '@/adapters/gemini';

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter();
    document.body.innerHTML = '';
  });

  it('has correct metadata', () => {
    expect(adapter.id).toBe('gemini');
    expect(adapter.name).toBe('Gemini');
    expect(adapter.hostPattern).toContain('gemini.google.com');
  });

  it('detects ready state when all elements exist', async () => {
    document.body.innerHTML = `
      <div class="ql-editor" contenteditable="true"></div>
      <img data-profile-avatar src="test.png" />
    `;
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects not ready when elements missing', async () => {
    document.body.innerHTML = '<div>empty</div>';
    expect(await adapter.isReady()).toBe(false);
  });
});
