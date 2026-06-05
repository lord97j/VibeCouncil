import { describe, it, expect, vi } from 'vitest';
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

  it('sets textarea value through native input semantics', async () => {
    const el = document.createElement('textarea');
    const onInput = vi.fn();
    const onChange = vi.fn();
    el.addEventListener('input', onInput);
    el.addEventListener('change', onChange);
    document.body.appendChild(el);

    await typeIntoInput(el, 'vibecoding能替代传统coding吗', 5);

    expect(el.value).toBe('vibecoding能替代传统coding吗');
    expect(onInput).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('uses execCommand insertion when a contenteditable editor accepts it', async () => {
    const originalExecCommand = document.execCommand;
    const el = document.createElement('div');
    el.contentEditable = 'true';
    document.body.appendChild(el);

    document.execCommand = vi.fn((_command, _showUi, value) => {
      el.textContent = value ?? '';
      return true;
    }) as typeof document.execCommand;

    await typeIntoInput(el, 'prompt', 5);

    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'prompt');
    expect(el.textContent).toBe('prompt');
    document.execCommand = originalExecCommand;
  });
});
