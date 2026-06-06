import type { AIPlatformAdapter } from '@/types';

export function registerAdapterContentScript(
  adapterId: string,
  adapterName: string,
  adapter: AIPlatformAdapter,
): void {
  console.log(`[VibeCouncil] ${adapterName} content script loaded`);
  let activeRequestId = 0;

  adapter.isReady().then(ready => {
    console.log(`[VibeCouncil] ${adapterName} adapter ready:`, ready);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log(`[VibeCouncil] ${adapterName} received message:`, message.type, message.adapterId);

    if (message.type === 'PING') {
      sendResponse({ type: 'PONG', adapterId });
      return false;
    }

    if (message.type === 'SEND_PROMPT' && message.adapterId === adapterId) {
      const requestId = ++activeRequestId;
      let promptAcknowledged = false;
      console.log(`[VibeCouncil] ${adapterName} sending prompt:`, message.prompt.substring(0, 80) + '...');

      adapter.sendPrompt(message.prompt)
        .then(() => {
          console.log(`[VibeCouncil] ${adapterName} prompt sent successfully`);
          promptAcknowledged = true;
          sendResponse({ type: 'PROMPT_SENT', adapterId });
          return adapter.waitForResponse();
        })
        .then(fullText => {
          if (requestId !== activeRequestId) return;
          chrome.runtime.sendMessage({
            type: 'RESPONSE_DONE',
            adapterId,
            fullText,
          }).catch(() => {});
        })
        .catch(err => {
          if (requestId !== activeRequestId) return;
          console.error(`[VibeCouncil] ${adapterName} prompt failed:`, err);
          const error = err instanceof Error ? err.message : String(err);
          if (!promptAcknowledged) {
            sendResponse({ type: 'RESPONSE_FAILED', adapterId, error });
            return;
          }
          chrome.runtime.sendMessage({
            type: 'RESPONSE_FAILED',
            adapterId,
            error,
          }).catch(() => {});
        });
      return true;
    }

    if (message.type === 'CHECK_STATUS' && message.adapterId === adapterId) {
      adapter.isReady().then(ready =>
        sendResponse({ type: 'ADAPTER_STATUS', adapterId, ready })
      );
      return true;
    }
  });
}
