import type { AIPlatformAdapter, AdapterSelectors } from '@/types';
import { querySelectorFallback, waitFor, delay, typeIntoInput } from '@/utils/dom';

/**
 * Base class for AI platform adapters.
 * Subclasses must implement selector getters and platform-specific logic.
 */
export abstract class BaseAdapter implements AIPlatformAdapter {
  abstract id: string;
  abstract name: string;
  abstract hostPattern: string;
  abstract defaultUrl: string;

  protected abstract selectors: AdapterSelectors;

  protected getPromptInput(): Element | null {
    return querySelectorFallback(this.selectors.promptInput);
  }

  protected getSendButton(): Element | null {
    for (const selector of this.selectors.sendButton.split(',').map(s => s.trim())) {
      if (!selector) continue;
      try {
        for (const button of document.querySelectorAll(selector)) {
          if (isClickableButton(button)) return button;
        }
      } catch {
        // Invalid selector — skip
      }
    }
    return null;
  }

  protected getLastResponseElement(): Element | null {
    return querySelectorFallback(this.selectors.lastResponse);
  }

  protected getGeneratingIndicator(): Element | null {
    return querySelectorFallback(this.selectors.generating);
  }

  protected getLoginIndicator(): Element | null {
    return querySelectorFallback(this.selectors.loggedIn);
  }

  protected getContinueButton(): Element | null {
    if (!this.selectors.continueButton) return null;
    return querySelectorFallback(this.selectors.continueButton);
  }

  async sendPrompt(text: string): Promise<void> {
    const input = this.getPromptInput();
    if (!input) throw new Error(`[${this.id}] Prompt input not found`);

    await typeIntoInput(input, text);

    let sendBtn: Element | null = null;
    try {
      await waitFor(() => this.getSendButton() !== null, 5000, 100);
      sendBtn = this.getSendButton();
    } catch {
      // Some sites only expose the send affordance after keyboard input,
      // or use unlabelled controls. Fall back to the standard chat shortcut.
    }

    if (sendBtn) {
      (sendBtn as HTMLButtonElement).click();
    } else {
      pressEnter(input);
    }

    await delay(200);
  }

  async waitForResponse(timeout = 120000): Promise<string> {
    // Wait for generation to start
    try {
      await waitFor(() => this.getGeneratingIndicator() !== null, 10000, 500);
    } catch {
      // Might have already finished — check for response
    }

    // Wait for generation to finish
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const generating = this.getGeneratingIndicator();
      if (!generating) break;
      // Auto-click "continue" button if present
      const btn = this.getContinueButton();
      if (btn) (btn as HTMLButtonElement).click();
      await delay(1000);
    }

    const responseEl = this.getLastResponseElement();
    if (!responseEl) throw new Error(`[${this.id}] Response element not found`);
    return responseEl.textContent ?? '';
  }

  async isReady(): Promise<boolean> {
    return this.getLoginIndicator() !== null
      && this.getPromptInput() !== null;
  }
}

function isClickableButton(el: Element): boolean {
  if (!(el instanceof HTMLButtonElement)) return true;
  return !el.disabled && el.getAttribute('aria-disabled') !== 'true';
}

function pressEnter(el: Element): void {
  const target = el as HTMLElement;
  target.focus();
  const eventInit: KeyboardEventInit = {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true,
  };
  target.dispatchEvent(new KeyboardEvent('keydown', eventInit));
  target.dispatchEvent(new KeyboardEvent('keypress', eventInit));
  target.dispatchEvent(new KeyboardEvent('keyup', eventInit));
}
