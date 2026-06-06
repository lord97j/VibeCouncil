/**
 * Try each comma-separated CSS selector in order, return first match.
 */
export function querySelectorFallback(selectors: string): Element | null {
  for (const selector of selectors.split(',').map(s => s.trim())) {
    if (!selector) continue;
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {
      // Invalid selector — skip
    }
  }
  return null;
}

/**
 * Poll until `condition` returns true, or reject on timeout.
 */
export function waitFor(
  condition: () => boolean,
  timeoutMs = 30000,
  intervalMs = 200,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`waitFor timeout after ${timeoutMs}ms`));
      }
    }, intervalMs);
  });
}

/**
 * Simple async delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate prompt entry into a contenteditable or input element.
 * Modern AI sites use controlled editors, so make sure both DOM value
 * and input/change events are updated.
 */
export async function typeIntoInput(
  el: Element,
  text: string,
  charDelayMs = 40,
): Promise<void> {
  const htmlEl = el as HTMLElement;
  htmlEl.click();
  htmlEl.focus();

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    setNativeValue(el, text);
    dispatchInputEvents(el, text);
    await delay(Math.max(charDelayMs, 20));
    return;
  }

  setContentEditableSelection(htmlEl);

  let inserted = false;
  if (document.execCommand) {
    inserted = document.execCommand('insertText', false, text);
  }

  const insertedByEditor = inserted && elementContainsText(el, text);

  if (!insertedByEditor) {
    dispatchPaste(el, text);
  }

  if (!elementContainsText(el, text)) {
    writeContentEditableText(htmlEl, text);
  }

  if (insertedByEditor) {
    dispatchEditorSyncEvents(el);
  } else {
    dispatchInputEvents(el, text);
  }
  await delay(Math.max(charDelayMs, 20));
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  valueSetter?.call(el, value);
  if (!valueSetter) el.value = value;
}

function setContentEditableSelection(el: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function dispatchPaste(el: Element, text: string): void {
  try {
    const data = new DataTransfer();
    data.setData('text/plain', text);
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: data,
    });
    el.dispatchEvent(event);
  } catch {
    // ClipboardEvent/DataTransfer may be unavailable in test environments.
  }
}

function writeContentEditableText(el: HTMLElement, text: string): void {
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  el.replaceChildren(paragraph);
}

function dispatchInputEvents(el: Element, text: string): void {
  const inputEventInit: InputEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    data: text,
    inputType: 'insertText',
  };

  try {
    el.dispatchEvent(new InputEvent('beforeinput', inputEventInit));
    el.dispatchEvent(new InputEvent('input', inputEventInit));
  } catch {
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }

  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
}

function dispatchEditorSyncEvents(el: Element): void {
  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
}

function elementContainsText(el: Element, text: string): boolean {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value.includes(text);
  }
  return (el.textContent ?? '').includes(text);
}
