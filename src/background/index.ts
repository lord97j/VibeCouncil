import type { ExtensionMessage } from '@/types';

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId !== undefined) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'vibe-council-discuss',
    title: '发送到 VibeCouncil 讨论',
    contexts: ['selection'],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vibe-council-discuss' && info.selectionText && tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });

    const message: ExtensionMessage = {
      type: 'CONTEXT_MENU_TRIGGER',
      selectedText: info.selectionText,
    };
    setTimeout(() => {
      chrome.runtime.sendMessage(message).catch(() => {});
    }, 500);
  }
});

// Relay messages between content scripts and side panel
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (sender.tab) {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
  sendResponse({ received: true });
});
