import type { ExtensionMessage } from '@/types';

/**
 * Send a message to a content script running in a specific tab.
 * Includes a timeout to prevent hanging if the content script doesn't respond.
 */
export async function sendToContentScript(
  tabId: number,
  message: ExtensionMessage,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message to tab ${tabId} timed out after 10s. Content script may not be loaded.`));
    }, 10000);

    chrome.tabs.sendMessage(tabId, message)
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Broadcast a message to the extension's side panel and background SW.
 */
export async function broadcastToSidePanel(
  message: ExtensionMessage,
): Promise<void> {
  await chrome.runtime.sendMessage(message);
}

/**
 * Type-safe message listener. Only fires for messages matching `type`.
 */
export function onMessage<T extends ExtensionMessage['type']>(
  type: T,
  handler: (
    message: Extract<ExtensionMessage, { type: T }>,
    sender: chrome.runtime.MessageSender,
  ) => void | Promise<void>,
): void {
  chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    if (message.type === type) {
      handler(message as Extract<ExtensionMessage, { type: T }>, sender);
    }
  });
}

/**
 * Send a prompt to an adapter running in a specific tab.
 */
export async function sendPromptToAdapter(
  tabId: number,
  adapterId: string,
  prompt: string,
): Promise<void> {
  await sendToContentScript(tabId, {
    type: 'SEND_PROMPT',
    adapterId,
    prompt,
  });
}
