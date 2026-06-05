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
 * Simulate human-like typing into a contenteditable or input element.
 * Uses execCommand('insertText') to trigger native input events.
 */
export async function typeIntoInput(
  el: Element,
  text: string,
  charDelayMs = 40,
): Promise<void> {
  (el as HTMLElement).focus();
  for (const char of text) {
    // execCommand may not be available in test environments (jsdom)
    if (document.execCommand) {
      document.execCommand('insertText', false, char);
    } else {
      // Fallback: direct textContent mutation for non-browser environments
      el.textContent = (el.textContent ?? '') + char;
    }
    await delay(charDelayMs + Math.random() * 40);
  }
}
