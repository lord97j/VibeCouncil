import '@testing-library/jest-dom';

const chromeMock = {
  runtime: {
    sendMessage: vi.fn(),
    getManifest: vi.fn(() => ({
      content_scripts: [
        {
          matches: ['https://chatgpt.com/*'],
          js: ['assets/chatgpt-loader.js'],
        },
        {
          matches: ['https://gemini.google.com/*'],
          js: ['assets/gemini-loader.js'],
        },
      ],
    })),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    reload: vi.fn(),
    get: vi.fn(),
    sendMessage: vi.fn(),
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  sidePanel: {
    open: vi.fn(),
    setOptions: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

Object.assign(globalThis, { chrome: chromeMock });
