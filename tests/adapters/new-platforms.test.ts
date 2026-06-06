import { beforeEach, describe, expect, it } from 'vitest';
import { DeepSeekAdapter } from '@/adapters/deepseek';
import { QianwenAdapter } from '@/adapters/qianwen';
import { GrokAdapter } from '@/adapters/grok';
import { ClaudeAdapter } from '@/adapters/claude';
import { AI_PLATFORMS, urlMatchesPlatform } from '@/platforms';

describe('new platform adapters', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('registers DeepSeek, Qianwen, Grok, and Claude platform metadata', () => {
    expect(AI_PLATFORMS.map(platform => platform.id)).toEqual([
      'chatgpt',
      'gemini',
      'grok',
      'claude',
      'deepseek',
      'qianwen',
    ]);
    expect(urlMatchesPlatform('https://grok.com/?q=', AI_PLATFORMS[2])).toBe(true);
    expect(urlMatchesPlatform('https://claude.ai/new', AI_PLATFORMS[3])).toBe(true);
    expect(urlMatchesPlatform('https://chat.deepseek.com/', AI_PLATFORMS[4])).toBe(true);
    expect(urlMatchesPlatform('https://www.qianwen.com/', AI_PLATFORMS[5])).toBe(true);
  });

  it('detects DeepSeek ready state from its textarea', async () => {
    const adapter = new DeepSeekAdapter();
    document.body.innerHTML = '<textarea placeholder="给 DeepSeek 发送消息 "></textarea>';
    expect(adapter.id).toBe('deepseek');
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects Qianwen ready state from its Slate textbox and send button', async () => {
    const adapter = new QianwenAdapter();
    document.body.innerHTML = `
      <div role="textbox" contenteditable="true"></div>
      <button aria-label="发送消息"></button>
    `;
    expect(adapter.name).toBe('千问');
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects Grok ready state from its ProseMirror textbox', async () => {
    const adapter = new GrokAdapter();
    document.body.innerHTML = '<div class="tiptap" aria-label="Ask Grok anything" contenteditable="true"></div>';
    expect(adapter.hostPattern).toContain('grok.com');
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects Claude ready state from its prompt textbox', async () => {
    const adapter = new ClaudeAdapter();
    document.body.innerHTML = '<div aria-label="Write your prompt to Claude" contenteditable="true"></div>';
    expect(adapter.defaultUrl).toContain('claude.ai');
    expect(await adapter.isReady()).toBe(true);
  });
});
