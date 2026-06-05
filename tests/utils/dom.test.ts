import { describe, it, expect } from 'vitest';
import { querySelectorFallback, waitFor, delay, typeIntoInput } from '@/utils/dom';

describe('querySelectorFallback', () => {
  it('returns the first matching element from comma-separated selectors', () => {
    document.body.innerHTML = '<div id="target">hello</div>';
    const el = querySelectorFallback('#nonexistent, #target, .other');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('hello');
  });

  it('returns null when no selector matches', () => {
    document.body.innerHTML = '<div>hello</div>';
    const el = querySelectorFallback('#nonexistent, .missing');
    expect(el).toBeNull();
  });
});

describe('waitFor', () => {
  it('resolves when condition becomes true', async () => {
    let value = false;
    setTimeout(() => { value = true; }, 50);
    await waitFor(() => value, 1000, 10);
    expect(value).toBe(true);
  });

  it('rejects on timeout', async () => {
    await expect(waitFor(() => false, 100, 10)).rejects.toThrow('timeout');
  });
});

describe('delay', () => {
  it('resolves after the specified milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('typeIntoInput', () => {
  it('types text into a contenteditable element', async () => {
    const el = document.createElement('div');
    el.contentEditable = 'true';
    document.body.appendChild(el);
    await typeIntoInput(el, 'ab', 5);
    expect(el.textContent).toBe('ab');
  });
});
