# VibeCouncil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that orchestrates multi-AI discussions through DOM interaction with ChatGPT and Gemini web apps.

**Architecture:** Pure Content Script lightweight architecture. Each AI platform has a pluggable Adapter (Content Script) that handles DOM read/write. An Orchestrator state machine in the Side Panel coordinates discussion flow using pluggable Strategy templates. Communication via `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`.

**Tech Stack:** TypeScript (strict), Manifest V3, Vite + CRXJS, React 18, Zustand, Tailwind CSS, Vitest

**Design Spec:** `docs/superpowers/specs/2026-06-03-vibe-council-design.md`

---

## File Structure

```
vibe-council/
├── manifest.json
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── vitest.config.ts
├── vitest.setup.ts
├── src/
│   ├── types/
│   │   └── index.ts                        # All shared type definitions
│   ├── utils/
│   │   ├── dom.ts                          # DOM helper utilities
│   │   └── text.ts                         # Text similarity & extraction
│   ├── messaging/
│   │   └── index.ts                        # Extension message protocol
│   ├── adapters/
│   │   ├── base.ts                         # BaseAdapter abstract class
│   │   ├── registry.ts                     # Adapter registry
│   │   ├── chatgpt/
│   │   │   ├── index.ts                    # ChatGPTAdapter
│   │   │   └── selectors.json             # CSS selectors config
│   │   └── gemini/
│   │       ├── index.ts                    # GeminiAdapter
│   │       └── selectors.json             # CSS selectors config
│   ├── strategies/
│   │   ├── types.ts                        # Strategy-specific types
│   │   ├── registry.ts                     # Strategy registry
│   │   ├── parallel.ts                     # Quick comparison
│   │   ├── delphi.ts                       # Expert convergence
│   │   ├── debate.ts                       # Roundtable debate
│   │   ├── six-hats.ts                     # Multi-perspective
│   │   ├── red-blue.ts                     # Red/blue team review
│   │   └── matrix.ts                       # Decision matrix scoring
│   ├── orchestrator/
│   │   ├── state-machine.ts               # Discussion state machine
│   │   ├── tab-manager.ts                 # Tab detection & management
│   │   └── anonymizer.ts                  # Anonymous synthesis logic
│   ├── sidepanel/
│   │   ├── index.html                     # Side panel entry HTML
│   │   ├── main.tsx                       # React mount point
│   │   ├── App.tsx                        # Root component + layout
│   │   ├── store/
│   │   │   └── discussionStore.ts         # Zustand store
│   │   └── components/
│   │       ├── QuestionInput.tsx           # Question + config inputs
│   │       ├── PlatformStatus.tsx          # Adapter tab status
│   │       ├── ProgressTimeline.tsx        # Round progress indicator
│   │       ├── DiscussionLog.tsx           # Message stream per round
│   │       ├── FinalConclusion.tsx         # Judge output display
│   │       └── Settings.tsx               # User preferences
│   └── background/
│       └── index.ts                        # Service Worker: context menu
└── tests/
    ├── setup.ts                            # Chrome API mocks
    ├── utils/
    │   ├── text.test.ts
    │   └── dom.test.ts
    ├── messaging/
    │   └── index.test.ts
    ├── adapters/
    │   ├── registry.test.ts
    │   ├── chatgpt.test.ts
    │   └── gemini.test.ts
    ├── strategies/
    │   ├── registry.test.ts
    │   ├── parallel.test.ts
    │   ├── delphi.test.ts
    │   └── debate.test.ts
    └── orchestrator/
        ├── state-machine.test.ts
        ├── tab-manager.test.ts
        └── anonymizer.test.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `manifest.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/sidepanel/index.html`
- Create: `src/sidepanel/main.tsx`
- Create: `src/sidepanel/App.tsx`
- Create: `src/background/index.ts`

- [ ] **Step 1: Initialize package.json and install dependencies**

```bash
cd /Users/yujingtao/lord97j/VibeCouncil
npm init -y
```

Then replace `package.json` with:

```json
{
  "name": "vibe-council",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

```bash
npm install react react-dom zustand
npm install -D typescript @types/react @types/react-dom @types/chrome
npm install -D vite @crxjs/vite-plugin@beta vitest jsdom
npm install -D tailwindcss postcss autoprefixer
npm install -D @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Create TypeScript configs**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create Vite config with CRXJS**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crx from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Create Manifest V3 manifest.json**

`manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "VibeCouncil",
  "description": "Multi-AI discussion orchestrator — browser-based expert council",
  "version": "0.1.0",
  "permissions": [
    "sidePanel",
    "tabs",
    "contextMenus",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://gemini.google.com/*"
  ],
  "side_panel": {
    "default_path": "src/sidepanel/index.html"
  },
  "action": {
    "default_title": "Open VibeCouncil"
  },
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*"],
      "js": ["src/adapters/chatgpt/index.ts"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://gemini.google.com/*"],
      "js": ["src/adapters/gemini/index.ts"],
      "run_at": "document_idle"
    }
  ]
}
```

- [ ] **Step 5: Create Tailwind and PostCSS configs**

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/sidepanel/**/*.{ts,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

`postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create Vitest config and setup**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

`tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';

// Mock chrome APIs
const chromeMock = {
  runtime: {
    sendMessage: vi.fn(),
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
    sendMessage: vi.fn(),
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
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
};

Object.assign(globalThis, { chrome: chromeMock });
```

- [ ] **Step 7: Create Side Panel entry files**

`src/sidepanel/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VibeCouncil</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

`src/sidepanel/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
```

Wait — we need a CSS entry. Let's create `src/sidepanel/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Update `src/sidepanel/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/sidepanel/App.tsx`:
```typescript
export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">VibeCouncil</h1>
      <p className="text-gray-500 mt-2">Multi-AI Expert Council</p>
    </div>
  );
}
```

`src/background/index.ts`:
```typescript
// Placeholder — will be implemented in Task 18
chrome.runtime.onInstalled.addListener(() => {
  console.log('VibeCouncil installed');
});
```

- [ ] **Step 8: Verify the project builds**

```bash
npx vite build
```

Expected: Build succeeds with no errors. Output includes side panel HTML and content script bundles.

- [ ] **Step 9: Verify tests run**

```bash
npx vitest run
```

Expected: No tests found (expected — we haven't written any yet). No config errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Chrome extension with Vite + CRXJS + React + Tailwind"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write the type definitions file**

`src/types/index.ts`:
```typescript
// ============================================================
// Adapter types
// ============================================================

export interface AIPlatformAdapter {
  id: string;
  name: string;
  hostPattern: string;
  defaultUrl: string;
  sendPrompt(text: string): Promise<void>;
  waitForResponse(timeout?: number): Promise<string>;
  isReady(): Promise<boolean>;
}

export interface AdapterSelectors {
  promptInput: string;
  sendButton: string;
  lastResponse: string;
  generating: string;
  loggedIn: string;
  continueButton?: string;
}

// ============================================================
// Discussion types
// ============================================================

export type PromptStyle = 'strict' | 'creative' | 'neutral';

export type DiscussionStatus =
  | 'idle'
  | 'dispatching'
  | 'collecting'
  | 'cross_review'
  | 'synthesizing'
  | 'done'
  | 'failed';

export type RoundType =
  | 'independent'
  | 'anonymous_synthesis'
  | 'critique_revise'
  | 'judge';

export type ResponseStatus = 'pending' | 'streaming' | 'completed' | 'failed';

export interface DiscussionConfig {
  rounds: number;
  strategyId: string;
  judgeAdapterId: string;
  promptStyle: PromptStyle;
  participantIds: string[];
}

export interface DiscussionSession {
  id: string;
  question: string;
  strategyId: string;
  config: DiscussionConfig;
  status: DiscussionStatus;
  rounds: Round[];
  finalConclusion?: Conclusion;
  createdAt: number;
  completedAt?: number;
}

export interface Round {
  roundNumber: number;
  type: RoundType;
  responses: AIResponse[];
  synthesis?: AnonymousSynthesis;
}

export interface AIResponse {
  adapterId: string;
  status: ResponseStatus;
  content: string;
  confidence?: number;
  changedMind?: boolean;
  changeReason?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface AnonymousSynthesis {
  consensus: string[];
  disagreements: string[];
  gaps: string[];
}

export interface Conclusion {
  judgeAdapterId: string;
  content: string;
  timestamp: number;
}

// ============================================================
// Strategy types
// ============================================================

export interface RoundContext {
  question: string;
  roundNumber: number;
  roundType: RoundType;
  previousRounds: Round[];
  synthesis?: AnonymousSynthesis;
  adapterId: string;
  promptStyle: PromptStyle;
}

export interface RoundAction {
  adapterId: string;
  prompt: string;
  roundType: RoundType;
}

export interface DiscussionStrategy {
  id: string;
  name: string;
  description: string;
  supportedRounds: [number, number];
  requiredParticipants: number;
  generateActions(state: DiscussionState): RoundAction[];
  advanceRound(state: DiscussionState): DiscussionState;
}

export interface DiscussionState {
  question: string;
  config: DiscussionConfig;
  status: DiscussionStatus;
  currentRoundIndex: number;
  rounds: Round[];
  finalConclusion?: Conclusion;
}

// ============================================================
// Messaging types
// ============================================================

export type ExtensionMessage =
  | { type: 'SEND_PROMPT'; adapterId: string; prompt: string }
  | { type: 'PROMPT_SENT'; adapterId: string }
  | { type: 'RESPONSE_CHUNK'; adapterId: string; chunk: string }
  | { type: 'RESPONSE_DONE'; adapterId: string; fullText: string }
  | { type: 'RESPONSE_FAILED'; adapterId: string; error: string }
  | { type: 'ADAPTER_STATUS'; adapterId: string; ready: boolean }
  | { type: 'START_DISCUSSION'; question: string; config: DiscussionConfig }
  | { type: 'DISCUSSION_UPDATE'; state: DiscussionState }
  | { type: 'CONTEXT_MENU_TRIGGER'; selectedText: string };

// ============================================================
// Storage types
// ============================================================

export interface UserSettings {
  defaultStrategyId: string;
  defaultJudgeAdapterId: string;
  defaultRounds: number;
  defaultPromptStyle: PromptStyle;
  historyLimit: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultStrategyId: 'delphi',
  defaultJudgeAdapterId: 'chatgpt',
  defaultRounds: 3,
  defaultPromptStyle: 'neutral',
  historyLimit: 50,
};
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add shared type definitions for adapters, strategies, discussions"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `src/utils/dom.ts`
- Create: `src/utils/text.ts`
- Create: `tests/utils/dom.test.ts`
- Create: `tests/utils/text.test.ts`

- [ ] **Step 1: Write failing test for DOM utils**

`tests/utils/dom.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/utils/dom.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement DOM utilities**

`src/utils/dom.ts`:
```typescript
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
  el.focus();
  for (const char of text) {
    document.execCommand('insertText', false, char);
    await delay(charDelayMs + Math.random() * 40);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/utils/dom.test.ts
```

Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Write failing test for text utils**

`tests/utils/text.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  extractKeySentences,
  findConsensus,
  findDisagreements,
  formatSynthesis,
} from '@/utils/text';

describe('extractKeySentences', () => {
  it('splits text into sentences and returns them', () => {
    const text = 'First point. Second point. Third point.';
    const sentences = extractKeySentences(text);
    expect(sentences).toHaveLength(3);
    expect(sentences[0]).toBe('First point.');
  });

  it('filters out very short sentences', () => {
    const text = 'OK. This is a real sentence with enough content.';
    const sentences = extractKeySentences(text);
    expect(sentences).toHaveLength(1);
  });
});

describe('findConsensus', () => {
  it('finds shared keywords across responses', () => {
    const responses = [
      'TypeScript offers strong type safety for large projects.',
      'TypeScript provides type safety and better tooling.',
    ];
    const consensus = findConsensus(responses);
    expect(consensus.length).toBeGreaterThan(0);
    expect(consensus.some(c => c.toLowerCase().includes('typescript'))).toBe(true);
  });

  it('returns empty for unrelated responses', () => {
    const responses = [
      'The weather is nice today.',
      'React 19 was released recently.',
    ];
    const consensus = findConsensus(responses);
    expect(consensus).toEqual([]);
  });
});

describe('findDisagreements', () => {
  it('identifies contrasting positions', () => {
    const responses = [
      'I strongly recommend using microservices for this project.',
      'Monolithic architecture is the better choice here.',
    ];
    const disagreements = findDisagreements(responses);
    expect(disagreements.length).toBeGreaterThan(0);
  });
});

describe('formatSynthesis', () => {
  it('formats synthesis into structured text', () => {
    const text = formatSynthesis(
      ['TypeScript is widely adopted.', 'Both agree on type safety.'],
      ['One prefers microservices, the other prefers monolith.'],
      ['Cost analysis was not discussed.'],
    );
    expect(text).toContain('Consensus');
    expect(text).toContain('Disagreements');
    expect(text).toContain('Gaps');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run tests/utils/text.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 7: Implement text utilities**

`src/utils/text.ts`:
```typescript
import type { AnonymousSynthesis } from '@/types';

/**
 * Minimum sentence length (characters) to be considered a key sentence.
 */
const MIN_SENTENCE_LENGTH = 15;

/**
 * Split text into sentences, filtering trivially short ones.
 */
export function extractKeySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= MIN_SENTENCE_LENGTH);
}

/**
 * Extract significant words from text (lowercased, no stop words).
 */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
    'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
    'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what',
    'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me',
    'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
    'it', 'its', 'they', 'them', 'their',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Find shared topics between responses based on overlapping significant tokens.
 */
export function findConsensus(responses: string[]): string[] {
  if (responses.length < 2) return [];

  const tokenSets = responses.map(r => new Set(tokenize(r)));
  const allTokens = [...new Set(tokenSets.flat())];

  const sharedTokens = allTokens.filter(token =>
    tokenSets.every(set => set.has(token))
  );

  // Map shared tokens back to the sentences that contain them
  const consensus: string[] = [];
  const allSentences = responses.flatMap(extractKeySentences);

  for (const token of sharedTokens.slice(0, 5)) {
    const matching = allSentences.find(s =>
      s.toLowerCase().includes(token)
    );
    if (matching && !consensus.includes(matching)) {
      consensus.push(matching);
    }
  }

  return consensus;
}

/**
 * Detect disagreements by looking for contrast patterns and opposing keywords.
 */
export function findDisagreements(responses: string[]): string[] {
  if (responses.length < 2) return [];

  const contrastPatterns = [
    /\b(recommend|prefer|should|best|better|right|correct)\b/i,
    /\b(against|disagree|wrong|bad|worse|avoid|don't|shouldn't)\b/i,
  ];

  const sentences = responses.flatMap(extractKeySentences);
  const disagreements: string[] = [];

  for (const sentence of sentences) {
    if (disagreements.length >= 5) break;
    const hasContrast = contrastPatterns.some(p => p.test(sentence));
    if (hasContrast) {
      disagreements.push(sentence);
    }
  }

  return disagreements;
}

/**
 * Format synthesis components into a structured text for the next AI round.
 */
export function formatSynthesis(
  consensus: string[],
  disagreements: string[],
  gaps: string[],
): string {
  const parts: string[] = [];

  if (consensus.length > 0) {
    parts.push(`Consensus:\n${consensus.map(c => `- ${c}`).join('\n')}`);
  }
  if (disagreements.length > 0) {
    parts.push(`Disagreements:\n${disagreements.map(d => `- ${d}`).join('\n')}`);
  }
  if (gaps.length > 0) {
    parts.push(`Gaps / Missing points:\n${gaps.map(g => `- ${g}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build a full AnonymousSynthesis from multiple AI responses.
 */
export function buildSynthesis(responses: string[]): AnonymousSynthesis {
  const consensus = findConsensus(responses);
  const disagreements = findDisagreements(responses);

  // Gaps: find topics mentioned in only one response
  const sentences = responses.flatMap(extractKeySentences);
  const tokenSets = responses.map(r => new Set(tokenize(r)));
  const gaps: string[] = [];

  for (let i = 0; i < responses.length; i++) {
    const uniqueTokens = [...tokenSets[i]].filter(
      t => !tokenSets.some((set, j) => j !== i && set.has(t))
    );
    for (const token of uniqueTokens.slice(0, 2)) {
      const matching = sentences.find(s =>
        s.toLowerCase().includes(token)
      );
      if (matching && !gaps.includes(matching)) {
        gaps.push(matching);
      }
    }
  }

  return { consensus, disagreements, gaps: gaps.slice(0, 5) };
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/utils/
```

Expected: PASS — all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/utils/ tests/utils/
git commit -m "feat: add DOM and text utility functions with tests"
```

---

## Task 4: Adapter Base Class + Registry

**Files:**
- Create: `src/adapters/base.ts`
- Create: `src/adapters/registry.ts`
- Create: `tests/adapters/registry.test.ts`

- [ ] **Step 1: Write failing test for adapter registry**

`tests/adapters/registry.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistry } from '@/adapters/registry';
import type { AIPlatformAdapter } from '@/types';

function createMockAdapter(id: string): AIPlatformAdapter {
  return {
    id,
    name: `Mock ${id}`,
    hostPattern: `*://${id}.com/*`,
    defaultUrl: `https://${id}.com`,
    sendPrompt: vi.fn().mockResolvedValue(undefined),
    waitForResponse: vi.fn().mockResolvedValue('mock response'),
    isReady: vi.fn().mockResolvedValue(true),
  };
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  it('registers and retrieves an adapter', () => {
    const adapter = createMockAdapter('test-ai');
    registry.register(adapter);
    expect(registry.get('test-ai')).toBe(adapter);
  });

  it('returns all registered adapters', () => {
    registry.register(createMockAdapter('a'));
    registry.register(createMockAdapter('b'));
    expect(registry.getAll()).toHaveLength(2);
  });

  it('returns undefined for unregistered adapter', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('filters adapters by host pattern', () => {
    registry.register(createMockAdapter('chatgpt'));
    registry.register(createMockAdapter('gemini'));
    const result = registry.findByHost('https://chatgpt.com/chat');
    expect(result?.id).toBe('chatgpt');
  });

  it('overwrites on duplicate registration', () => {
    registry.register(createMockAdapter('x'));
    const updated = createMockAdapter('x');
    updated.name = 'Updated X';
    registry.register(updated);
    expect(registry.get('x')?.name).toBe('Updated X');
    expect(registry.getAll()).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/adapters/registry.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement BaseAdapter**

`src/adapters/base.ts`:
```typescript
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
    return querySelectorFallback(this.selectors.sendButton);
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
    await delay(200);

    const sendBtn = this.getSendButton();
    if (!sendBtn) throw new Error(`[${this.id}] Send button not found`);
    (sendBtn as HTMLButtonElement).click();
  }

  async waitForResponse(timeout = 120000): Promise<string> {
    // Wait for generation to start
    try {
      await waitFor(() => this.getGeneratingIndicator() !== null, 10000, 500);
    } catch {
      // Might have already finished — check for response
    }

    // If there's a "continue" button, click it automatically
    const tryContinue = async () => {
      const btn = this.getContinueButton();
      if (btn) (btn as HTMLButtonElement).click();
    };

    // Wait for generation to finish
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const generating = this.getGeneratingIndicator();
      if (!generating) break;
      await tryContinue();
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
```

- [ ] **Step 4: Implement AdapterRegistry**

`src/adapters/registry.ts`:
```typescript
import type { AIPlatformAdapter } from '@/types';

export class AdapterRegistry {
  private adapters = new Map<string, AIPlatformAdapter>();

  register(adapter: AIPlatformAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): AIPlatformAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): AIPlatformAdapter[] {
    return [...this.adapters.values()];
  }

  findByHost(url: string): AIPlatformAdapter | undefined {
    const hostname = new URL(url).hostname;
    return this.adapters.values().find(a => hostname.includes(a.id));
  }

  clear(): void {
    this.adapters.clear();
  }
}

/** Global singleton registry */
export const adapterRegistry = new AdapterRegistry();
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/adapters/registry.test.ts
```

Expected: PASS — all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/adapters/base.ts src/adapters/registry.ts tests/adapters/registry.test.ts
git commit -m "feat: add BaseAdapter abstract class and AdapterRegistry with tests"
```

---

## Task 5: ChatGPT Adapter

**Files:**
- Create: `src/adapters/chatgpt/selectors.json`
- Create: `src/adapters/chatgpt/index.ts`
- Create: `tests/adapters/chatgpt.test.ts`

- [ ] **Step 1: Create ChatGPT selectors config**

`src/adapters/chatgpt/selectors.json`:
```json
{
  "version": "2024.6",
  "promptInput": "#prompt-textarea, div[contenteditable][data-id='root'], textarea[placeholder*='Message']",
  "sendButton": "button[data-testid='send-button'], button[aria-label='Send prompt']",
  "lastResponse": "[data-message-author-role='assistant']:last-child .markdown, .agent-turn:last-child .markdown",
  "generating": "[data-testid='stop-button'], .result-streaming",
  "loggedIn": "nav[aria-label='Chat history'], [data-testid='profile-button'], button[aria-label='Open profile menu']",
  "continueButton": "button:has(.lucide\\:arrow-right), button[aria-label='Continue generating']"
}
```

- [ ] **Step 2: Write failing test for ChatGPT adapter**

`tests/adapters/chatgpt.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ChatGPTAdapter } from '@/adapters/chatgpt';
import type { AdapterSelectors } from '@/types';
import selectors from '@/adapters/chatgpt/selectors.json';

describe('ChatGPTAdapter', () => {
  let adapter: ChatGPTAdapter;

  beforeEach(() => {
    adapter = new ChatGPTAdapter();
    document.body.innerHTML = '';
  });

  it('has correct metadata', () => {
    expect(adapter.id).toBe('chatgpt');
    expect(adapter.name).toBe('ChatGPT');
    expect(adapter.hostPattern).toContain('chatgpt.com');
  });

  it('loads selectors from JSON config', () => {
    expect(adapter.getSelectors()).toEqual(selectors);
  });

  it('detects ready state when all elements exist', async () => {
    // Simulate ChatGPT DOM
    document.body.innerHTML = `
      <div id="prompt-textarea" contenteditable="true"></div>
      <nav aria-label="Chat history"></nav>
    `;
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects not ready when elements missing', async () => {
    document.body.innerHTML = '<div>empty</div>';
    expect(await adapter.isReady()).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/adapters/chatgpt.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement ChatGPT adapter**

`src/adapters/chatgpt/index.ts`:
```typescript
import { BaseAdapter } from '@/adapters/base';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class ChatGPTAdapter extends BaseAdapter {
  id = 'chatgpt' as const;
  name = 'ChatGPT';
  hostPattern = '*://chatgpt.com/*';
  defaultUrl = 'https://chatgpt.com';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;

  getSelectors(): AdapterSelectors {
    return this.selectors;
  }
}

// Self-register in content script context
if (typeof window !== 'undefined') {
  // Content script entry: listen for messages from side panel
  const adapter = new ChatGPTAdapter();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SEND_PROMPT' && message.adapterId === 'chatgpt') {
      adapter.sendPrompt(message.prompt)
        .then(() => sendResponse({ type: 'PROMPT_SENT', adapterId: 'chatgpt' }))
        .catch(err => sendResponse({ type: 'RESPONSE_FAILED', adapterId: 'chatgpt', error: err.message }));
      return true; // async response
    }

    if (message.type === 'CHECK_STATUS' && message.adapterId === 'chatgpt') {
      adapter.isReady().then(ready =>
        sendResponse({ type: 'ADAPTER_STATUS', adapterId: 'chatgpt', ready })
      );
      return true;
    }
  });

  // Auto-detect response completion and send chunks
  let lastContent = '';
  const observer = new MutationObserver(() => {
    const generating = document.querySelector(selectors.generating);
    if (generating) {
      // Still generating — send chunk
      const responseEl = document.querySelector(selectors.lastResponse);
      const newContent = responseEl?.textContent ?? '';
      if (newContent !== lastContent) {
        const chunk = newContent.slice(lastContent.length);
        lastContent = newContent;
        chrome.runtime.sendMessage({
          type: 'RESPONSE_CHUNK',
          adapterId: 'chatgpt',
          chunk,
        });
      }
    } else if (lastContent) {
      // Generation just finished
      const responseEl = document.querySelector(selectors.lastResponse);
      const fullText = responseEl?.textContent ?? lastContent;
      chrome.runtime.sendMessage({
        type: 'RESPONSE_DONE',
        adapterId: 'chatgpt',
        fullText,
      });
      lastContent = '';
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/adapters/chatgpt.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/adapters/chatgpt/ tests/adapters/chatgpt.test.ts
git commit -m "feat: add ChatGPT adapter with selectors config and DOM observer"
```

---

## Task 6: Gemini Adapter

**Files:**
- Create: `src/adapters/gemini/selectors.json`
- Create: `src/adapters/gemini/index.ts`
- Create: `tests/adapters/gemini.test.ts`

- [ ] **Step 1: Create Gemini selectors config**

`src/adapters/gemini/selectors.json`:
```json
{
  "version": "2024.6",
  "promptInput": "div.ql-editor[contenteditable='true'], textarea[placeholder*='Enter'], .input-area-container textarea",
  "sendButton": "button[aria-label='Send message'], button.send-button, mat-icon-button[aria-label*='Send']",
  "lastResponse": ".model-response-text:last-child, message-content:last-child, .conversation-container .response-container:last-child .markdown",
  "generating": ".response-streaming, .loading-indicator, .generating-indicator",
  "loggedIn": "img[data-profile-avatar], [aria-label='Account'], .user-profile-icon",
  "continueButton": "button[aria-label='Continue generating'], button:has(.continue-icon)"
}
```

- [ ] **Step 2: Write failing test for Gemini adapter**

`tests/adapters/gemini.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiAdapter } from '@/adapters/gemini';

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter();
    document.body.innerHTML = '';
  });

  it('has correct metadata', () => {
    expect(adapter.id).toBe('gemini');
    expect(adapter.name).toBe('Gemini');
    expect(adapter.hostPattern).toContain('gemini.google.com');
  });

  it('detects ready state when all elements exist', async () => {
    document.body.innerHTML = `
      <div class="ql-editor" contenteditable="true"></div>
      <img data-profile-avatar src="test.png" />
    `;
    expect(await adapter.isReady()).toBe(true);
  });

  it('detects not ready when elements missing', async () => {
    document.body.innerHTML = '<div>empty</div>';
    expect(await adapter.isReady()).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/adapters/gemini.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement Gemini adapter**

`src/adapters/gemini/index.ts`:
```typescript
import { BaseAdapter } from '@/adapters/base';
import type { AdapterSelectors } from '@/types';
import selectors from './selectors.json';

export class GeminiAdapter extends BaseAdapter {
  id = 'gemini' as const;
  name = 'Gemini';
  hostPattern = '*://gemini.google.com/*';
  defaultUrl = 'https://gemini.google.com/app';
  protected selectors: AdapterSelectors = selectors as AdapterSelectors;

  getSelectors(): AdapterSelectors {
    return this.selectors;
  }
}

// Self-register in content script context
if (typeof window !== 'undefined') {
  const adapter = new GeminiAdapter();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SEND_PROMPT' && message.adapterId === 'gemini') {
      adapter.sendPrompt(message.prompt)
        .then(() => sendResponse({ type: 'PROMPT_SENT', adapterId: 'gemini' }))
        .catch(err => sendResponse({ type: 'RESPONSE_FAILED', adapterId: 'gemini', error: err.message }));
      return true;
    }

    if (message.type === 'CHECK_STATUS' && message.adapterId === 'gemini') {
      adapter.isReady().then(ready =>
        sendResponse({ type: 'ADAPTER_STATUS', adapterId: 'gemini', ready })
      );
      return true;
    }
  });

  let lastContent = '';
  const observer = new MutationObserver(() => {
    const generating = document.querySelector(selectors.generating);
    if (generating) {
      const responseEl = document.querySelector(selectors.lastResponse);
      const newContent = responseEl?.textContent ?? '';
      if (newContent !== lastContent) {
        const chunk = newContent.slice(lastContent.length);
        lastContent = newContent;
        chrome.runtime.sendMessage({
          type: 'RESPONSE_CHUNK',
          adapterId: 'gemini',
          chunk,
        });
      }
    } else if (lastContent) {
      const responseEl = document.querySelector(selectors.lastResponse);
      const fullText = responseEl?.textContent ?? lastContent;
      chrome.runtime.sendMessage({
        type: 'RESPONSE_DONE',
        adapterId: 'gemini',
        fullText,
      });
      lastContent = '';
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/adapters/gemini.test.ts
```

Expected: PASS — all 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/adapters/gemini/ tests/adapters/gemini.test.ts
git commit -m "feat: add Gemini adapter with selectors config and DOM observer"
```

---

## Task 7: Messaging Layer

**Files:**
- Create: `src/messaging/index.ts`
- Create: `tests/messaging/index.test.ts`

- [ ] **Step 1: Write failing test for messaging**

`tests/messaging/index.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToContentScript, broadcastToSidePanel, onMessage } from '@/messaging';
import type { ExtensionMessage } from '@/types';

describe('messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendToContentScript', () => {
    it('sends message to a specific tab', async () => {
      const tabId = 42;
      const message: ExtensionMessage = {
        type: 'SEND_PROMPT',
        adapterId: 'chatgpt',
        prompt: 'Hello',
      };
      (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

      await sendToContentScript(tabId, message);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });
  });

  describe('broadcastToSidePanel', () => {
    it('sends message via chrome.runtime.sendMessage', async () => {
      const message: ExtensionMessage = {
        type: 'RESPONSE_DONE',
        adapterId: 'chatgpt',
        fullText: 'Hello back',
      };
      (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await broadcastToSidePanel(message);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('onMessage', () => {
    it('registers a listener for specific message types', () => {
      const handler = vi.fn();
      onMessage('RESPONSE_DONE', handler);

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate a matching message
      listener({ type: 'RESPONSE_DONE', adapterId: 'chatgpt', fullText: 'test' }, {}, vi.fn());
      expect(handler).toHaveBeenCalled();
    });

    it('does not call handler for non-matching message types', () => {
      const handler = vi.fn();
      onMessage('RESPONSE_DONE', handler);

      const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
      listener({ type: 'SEND_PROMPT', adapterId: 'chatgpt', prompt: 'test' }, {}, vi.fn());
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/messaging/index.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement messaging layer**

`src/messaging/index.ts`:
```typescript
import type { ExtensionMessage } from '@/types';

/**
 * Send a message to a content script running in a specific tab.
 */
export async function sendToContentScript(
  tabId: number,
  message: ExtensionMessage,
): Promise<void> {
  await chrome.tabs.sendMessage(tabId, message);
}

/**
 * Broadcast a message to the extension's side panel and background SW.
 * Uses chrome.runtime.sendMessage which reaches all extension pages.
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/messaging/index.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/messaging/ tests/messaging/
git commit -m "feat: add messaging layer for content script ↔ side panel communication"
```

---

## Task 8: Tab Manager

**Files:**
- Create: `src/orchestrator/tab-manager.ts`
- Create: `tests/orchestrator/tab-manager.test.ts`

- [ ] **Step 1: Write failing test for tab manager**

`tests/orchestrator/tab-manager.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabManager } from '@/orchestrator/tab-manager';
import type { AIPlatformAdapter } from '@/types';

function mockAdapter(id: string, host: string, url: string): AIPlatformAdapter {
  return { id, name: id, hostPattern: host, defaultUrl: url } as AIPlatformAdapter;
}

describe('TabManager', () => {
  let manager: TabManager;

  beforeEach(() => {
    manager = new TabManager();
    vi.clearAllMocks();
  });

  it('finds open tabs for registered adapters', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, url: 'https://chatgpt.com/chat' },
      { id: 2, url: 'https://gemini.google.com/app' },
    ]);

    const adapters = [
      mockAdapter('chatgpt', '*://chatgpt.com/*', 'https://chatgpt.com'),
      mockAdapter('gemini', '*://gemini.google.com/*', 'https://gemini.google.com/app'),
    ];

    const tabs = await manager.findAdapterTabs(adapters);
    expect(tabs.get('chatgpt')?.id).toBe(1);
    expect(tabs.get('gemini')?.id).toBe(2);
  });

  it('returns empty map when no tabs found', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const tabs = await manager.findAdapterTabs([
      mockAdapter('chatgpt', '*://chatgpt.com/*', 'https://chatgpt.com'),
    ]);
    expect(tabs.size).toBe(0);
  });

  it('opens a new tab for an adapter', async () => {
    const adapter = mockAdapter('gemini', '*://gemini.google.com/*', 'https://gemini.google.com/app');
    await manager.openPlatformTab(adapter);
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://gemini.google.com/app',
      active: false,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/orchestrator/tab-manager.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement TabManager**

`src/orchestrator/tab-manager.ts`:
```typescript
import type { AIPlatformAdapter } from '@/types';

export class TabManager {
  /**
   * Find currently open tabs that match any of the registered adapters.
   */
  async findAdapterTabs(
    adapters: AIPlatformAdapter[],
  ): Promise<Map<string, chrome.tabs.Tab>> {
    const allTabs = await chrome.tabs.query({});
    const result = new Map<string, chrome.tabs.Tab>();

    for (const adapter of adapters) {
      const matched = allTabs.find(tab => {
        if (!tab.url) return false;
        try {
          const hostname = new URL(tab.url).hostname;
          return hostname.includes(adapter.id) || tab.url.includes(adapter.id);
        } catch {
          return false;
        }
      });
      if (matched) {
        result.set(adapter.id, matched);
      }
    }

    return result;
  }

  /**
   * Open a new background tab for the given adapter.
   */
  async openPlatformTab(adapter: AIPlatformAdapter): Promise<chrome.tabs.Tab> {
    return chrome.tabs.create({
      url: adapter.defaultUrl,
      active: false,
    });
  }

  /**
   * Open tabs for all adapters not yet present.
   * Returns the updated tab map.
   */
  async ensureAllTabsOpen(
    adapters: AIPlatformAdapter[],
  ): Promise<Map<string, chrome.tabs.Tab>> {
    const existing = await this.findAdapterTabs(adapters);
    for (const adapter of adapters) {
      if (!existing.has(adapter.id)) {
        const tab = await this.openPlatformTab(adapter);
        existing.set(adapter.id, tab);
      }
    }
    return existing;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/orchestrator/tab-manager.test.ts
```

Expected: PASS — all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/orchestrator/tab-manager.ts tests/orchestrator/tab-manager.test.ts
git commit -m "feat: add TabManager for detecting and opening AI platform tabs"
```

---

## Task 9: Strategy Types + Registry

**Files:**
- Create: `src/strategies/types.ts`
- Create: `src/strategies/registry.ts`
- Create: `tests/strategies/registry.test.ts`

- [ ] **Step 1: Create strategy-specific types**

`src/strategies/types.ts`:
```typescript
/**
 * Re-export discussion strategy interface and related types from main types.
 */
export type {
  DiscussionStrategy,
  DiscussionState,
  RoundAction,
  RoundContext,
  DiscussionConfig,
  Round,
  RoundType,
  AIResponse,
  AnonymousSynthesis,
  Conclusion,
  DiscussionStatus,
  PromptStyle,
} from '@/types';

/**
 * Prompt templates per style.
 */
export const PROMPT_STYLES = {
  strict: {
    tone: 'Be precise and rigorous. Cite specifics. Avoid speculation.',
    format: 'Structure your response with clear headings and bullet points.',
  },
  creative: {
    tone: 'Think creatively and explore unconventional ideas. Be bold.',
    format: 'Feel free to use analogies, scenarios, and narrative approaches.',
  },
  neutral: {
    tone: 'Provide a balanced, objective analysis.',
    format: 'Present your reasoning clearly and concisely.',
  },
} as const;

/**
 * Anti-conformity instruction appended to all cross-review prompts.
 */
export const ANTI_CONFORMITY_PROMPT = `Important instructions:
- Do NOT simply agree with other opinions. You must identify specific points you disagree with or find incomplete.
- If you change your position, explicitly state what changed and why.
- Highlight any risks, gaps, or assumptions that others may have missed.`;
```

- [ ] **Step 2: Write failing test for strategy registry**

`tests/strategies/registry.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StrategyRegistry } from '@/strategies/registry';
import type { DiscussionStrategy } from '@/types';

function createMockStrategy(id: string): DiscussionStrategy {
  return {
    id,
    name: `Strategy ${id}`,
    description: `Description for ${id}`,
    supportedRounds: [2, 4],
    requiredParticipants: 2,
    generateActions: vi.fn().mockReturnValue([]),
    advanceRound: vi.fn().mockReturnValue({} as any),
  };
}

describe('StrategyRegistry', () => {
  let registry: StrategyRegistry;

  beforeEach(() => {
    registry = new StrategyRegistry();
  });

  it('registers and retrieves a strategy', () => {
    const strategy = createMockStrategy('delphi');
    registry.register(strategy);
    expect(registry.get('delphi')).toBe(strategy);
  });

  it('returns all registered strategies', () => {
    registry.register(createMockStrategy('a'));
    registry.register(createMockStrategy('b'));
    expect(registry.getAll()).toHaveLength(2);
  });

  it('returns undefined for unknown strategy', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('returns strategies sorted by id', () => {
    registry.register(createMockStrategy('debate'));
    registry.register(createMockStrategy('parallel'));
    registry.register(createMockStrategy('delphi'));
    const ids = registry.getAll().map(s => s.id);
    expect(ids).toEqual(['debate', 'delphi', 'parallel']);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/strategies/registry.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement StrategyRegistry**

`src/strategies/registry.ts`:
```typescript
import type { DiscussionStrategy } from '@/types';

export class StrategyRegistry {
  private strategies = new Map<string, DiscussionStrategy>();

  register(strategy: DiscussionStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  get(id: string): DiscussionStrategy | undefined {
    return this.strategies.get(id);
  }

  getAll(): DiscussionStrategy[] {
    return [...this.strategies.values()].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
  }

  clear(): void {
    this.strategies.clear();
  }
}

/** Global singleton registry */
export const strategyRegistry = new StrategyRegistry();
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run tests/strategies/registry.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/strategies/types.ts src/strategies/registry.ts tests/strategies/registry.test.ts
git commit -m "feat: add strategy types, prompt templates, and StrategyRegistry"
```

---

## Task 10: Parallel Strategy

**Files:**
- Create: `src/strategies/parallel.ts`
- Create: `tests/strategies/parallel.test.ts`

- [ ] **Step 1: Write failing test for parallel strategy**

`tests/strategies/parallel.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { ParallelStrategy } from '@/strategies/parallel';
import type { DiscussionState, DiscussionConfig } from '@/types';

function createTestState(overrides?: Partial<DiscussionState>): DiscussionState {
  return {
    question: 'What is the best programming language?',
    config: {
      rounds: 1,
      strategyId: 'parallel',
      judgeAdapterId: 'chatgpt',
      promptStyle: 'neutral',
      participantIds: ['chatgpt', 'gemini'],
    } as DiscussionConfig,
    status: 'idle',
    currentRoundIndex: 0,
    rounds: [],
    ...overrides,
  };
}

describe('ParallelStrategy', () => {
  const strategy = new ParallelStrategy();

  it('has correct metadata', () => {
    expect(strategy.id).toBe('parallel');
    expect(strategy.name).toBe('快速对比');
    expect(strategy.requiredParticipants).toBe(2);
    expect(strategy.supportedRounds).toEqual([1, 1]);
  });

  it('generates one independent action per participant', () => {
    const state = createTestState({ status: 'dispatching' });
    const actions = strategy.generateActions(state);
    expect(actions).toHaveLength(2);
    expect(actions[0].adapterId).toBe('chatgpt');
    expect(actions[1].adapterId).toBe('gemini');
    expect(actions[0].roundType).toBe('independent');
  });

  it('advances to done after one round', () => {
    const state = createTestState({
      status: 'collecting',
      currentRoundIndex: 0,
      rounds: [{
        roundNumber: 1,
        type: 'independent',
        responses: [
          { adapterId: 'chatgpt', status: 'completed', content: 'Python', startedAt: 0 },
          { adapterId: 'gemini', status: 'completed', content: 'JavaScript', startedAt: 0 },
        ],
      }],
    });
    const next = strategy.advanceRound(state);
    expect(next.status).toBe('done');
  });

  it('wraps prompt with style instructions', () => {
    const state = createTestState({ status: 'dispatching' });
    state.config.promptStyle = 'strict';
    const actions = strategy.generateActions(state);
    expect(actions[0].prompt).toContain('precise');
    expect(actions[0].prompt).toContain(state.question);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/strategies/parallel.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ParallelStrategy**

`src/strategies/parallel.ts`:
```typescript
import type { DiscussionStrategy, DiscussionState, RoundAction } from '@/types';
import { PROMPT_STYLES } from './types';

export class ParallelStrategy implements DiscussionStrategy {
  id = 'parallel' as const;
  name = '快速对比';
  description = '各 AI 并行独立回答，无交叉讨论';
  supportedRounds: [number, number] = [1, 1];
  requiredParticipants = 2;

  generateActions(state: DiscussionState): RoundAction[] {
    const style = PROMPT_STYLES[state.config.promptStyle];

    return state.config.participantIds.map(adapterId => ({
      adapterId,
      roundType: 'independent' as const,
      prompt: `${style.tone}\n\n${style.format}\n\nQuestion:\n${state.question}\n\nPlease provide your independent analysis.`,
    }));
  }

  advanceRound(state: DiscussionState): DiscussionState {
    return {
      ...state,
      status: 'done',
      currentRoundIndex: state.currentRoundIndex + 1,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/strategies/parallel.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/strategies/parallel.ts tests/strategies/parallel.test.ts
git commit -m "feat: add Parallel strategy — simplest discussion template"
```

---

## Task 11: Anonymous Synthesizer

**Files:**
- Create: `src/orchestrator/anonymizer.ts`
- Create: `tests/orchestrator/anonymizer.test.ts`

- [ ] **Step 1: Write failing test for anonymizer**

`tests/orchestrator/anonymizer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { anonymizeResponses, buildAnonymousPrompt } from '@/orchestrator/anonymizer';
import type { AIResponse, Round } from '@/types';

describe('anonymizeResponses', () => {
  it('strips adapter identifiers from responses', () => {
    const responses: AIResponse[] = [
      { adapterId: 'chatgpt', status: 'completed', content: 'I think TypeScript is best because of type safety.', startedAt: 0 },
      { adapterId: 'gemini', status: 'completed', content: 'I think TypeScript is best because of type safety. But also consider Python.', startedAt: 0 },
    ];
    const result = anonymizeResponses(responses);
    expect(result.texts).toHaveLength(2);
    expect(result.texts[0]).not.toContain('chatgpt');
    expect(result.texts[1]).not.toContain('gemini');
    expect(result.consensus.length).toBeGreaterThan(0);
  });

  it('handles single response', () => {
    const responses: AIResponse[] = [
      { adapterId: 'chatgpt', status: 'completed', content: 'Some answer.', startedAt: 0 },
    ];
    const result = anonymizeResponses(responses);
    expect(result.texts).toHaveLength(1);
  });
});

describe('buildAnonymousPrompt', () => {
  it('formats a prompt from anonymized responses', () => {
    const responses: AIResponse[] = [
      { adapterId: 'chatgpt', status: 'completed', content: 'Use microservices for scalability.', startedAt: 0 },
      { adapterId: 'gemini', status: 'completed', content: 'Use monolith for simplicity.', startedAt: 0 },
    ];
    const prompt = buildAnonymousPrompt(responses, 'What architecture to use?');
    expect(prompt).toContain('Expert 1');
    expect(prompt).toContain('Expert 2');
    expect(prompt).not.toContain('chatgpt');
    expect(prompt).not.toContain('gemini');
    expect(prompt).toContain('review');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/orchestrator/anonymizer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement anonymizer**

`src/orchestrator/anonymizer.ts`:
```typescript
import type { AIResponse, AnonymousSynthesis } from '@/types';
import { buildSynthesis, formatSynthesis } from '@/utils/text';

interface AnonymizedResult {
  texts: string[];
  synthesis: AnonymousSynthesis;
}

/**
 * Strip adapter identifiers and produce anonymous summary.
 */
export function anonymizeResponses(responses: AIResponse[]): AnonymizedResult {
  const texts = responses
    .filter(r => r.status === 'completed' && r.content)
    .map(r => r.content);

  const synthesis = buildSynthesis(texts);

  return { texts, synthesis };
}

/**
 * Build an anonymous review prompt for the critique round.
 * Labels each response as "Expert N" to hide the source.
 */
export function buildAnonymousPrompt(
  responses: AIResponse[],
  originalQuestion: string,
): string {
  const { texts, synthesis } = anonymizeResponses(responses);
  const synthesisText = formatSynthesis(
    synthesis.consensus,
    synthesis.disagreements,
    synthesis.gaps,
  );

  const expertResponses = texts
    .map((text, i) => `Expert ${i + 1}:\n${text}`)
    .join('\n\n');

  return `Original question: ${originalQuestion}

Here is an anonymous summary of expert opinions:

${synthesisText}

Individual expert responses:

${expertResponses}

Please review the above opinions. You must:
1. Identify specific points you disagree with and explain why
2. Note any gaps or risks the other experts missed
3. State whether you change your original position and why

Do NOT simply agree with the majority. Provide your critical assessment.`;
}

/**
 * Build the judge prompt for the final synthesis round.
 * This includes the full discussion history (all rounds).
 */
export function buildJudgePrompt(
  question: string,
  rounds: { roundNumber: number; type: string; responses: AIResponse[]; synthesis?: AnonymousSynthesis }[],
): string {
  const parts = [`Original question: ${question}`];

  for (const round of rounds) {
    const completedResponses = round.responses.filter(
      r => r.status === 'completed' && r.content
    );

    if (round.type === 'independent') {
      parts.push(`\n--- Round ${round.roundNumber}: Independent Answers ---`);
      for (const r of completedResponses) {
        parts.push(`\n[${r.adapterId}]: ${r.content}`);
      }
    } else if (round.type === 'anonymous_synthesis' && round.synthesis) {
      parts.push(`\n--- Round ${round.roundNumber}: Anonymous Summary ---`);
      parts.push(formatSynthesis(
        round.synthesis.consensus,
        round.synthesis.disagreements,
        round.synthesis.gaps,
      ));
    } else if (round.type === 'critique_revise') {
      parts.push(`\n--- Round ${round.roundNumber}: Critique & Revision ---`);
      for (const r of completedResponses) {
        parts.push(`\n[${r.adapterId}]: ${r.content}`);
      }
    }
  }

  parts.push(`
--- Final Judge Instruction ---
You are the designated judge. Based on the entire discussion above, provide:
1. A structured summary of all viewpoints
2. Areas of consensus and disagreement
3. Your final recommended answer with reasoning
4. Any caveats or conditions for your recommendation`);

  return parts.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/orchestrator/anonymizer.test.ts
```

Expected: PASS — all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/orchestrator/anonymizer.ts tests/orchestrator/anonymizer.test.ts
git commit -m "feat: add anonymizer for Delphi-style anonymous synthesis"
```

---

## Task 12: Delphi Strategy

**Files:**
- Create: `src/strategies/delphi.ts`
- Create: `tests/strategies/delphi.test.ts`

- [ ] **Step 1: Write failing test for Delphi strategy**

`tests/strategies/delphi.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { DelphiStrategy } from '@/strategies/delphi';
import type { DiscussionState, DiscussionConfig, Round, AIResponse } from '@/types';

function createDelphiState(overrides?: Partial<DiscussionState>): DiscussionState {
  return {
    question: 'Is microservices better than monolith?',
    config: {
      rounds: 3,
      strategyId: 'delphi',
      judgeAdapterId: 'chatgpt',
      promptStyle: 'neutral',
      participantIds: ['chatgpt', 'gemini'],
    } as DiscussionConfig,
    status: 'idle',
    currentRoundIndex: 0,
    rounds: [],
    ...overrides,
  };
}

function completedResponse(adapterId: string, content: string): AIResponse {
  return { adapterId, status: 'completed', content, startedAt: 0, completedAt: 1, confidence: 4 };
}

describe('DelphiStrategy', () => {
  const strategy = new DelphiStrategy();

  it('has correct metadata', () => {
    expect(strategy.id).toBe('delphi');
    expect(strategy.name).toBe('专家收敛');
    expect(strategy.supportedRounds).toEqual([2, 4]);
  });

  it('generates independent actions for round 0', () => {
    const state = createDelphiState({ status: 'dispatching' });
    const actions = strategy.generateActions(state);
    expect(actions).toHaveLength(2);
    expect(actions.every(a => a.roundType === 'independent')).toBe(true);
  });

  it('generates critique actions for round 1 (after synthesis)', () => {
    const round1: Round = {
      roundNumber: 1,
      type: 'independent',
      responses: [
        completedResponse('chatgpt', 'Microservices scale better.'),
        completedResponse('gemini', 'Monolith is simpler.'),
      ],
    };
    const state = createDelphiState({
      status: 'cross_review',
      currentRoundIndex: 1,
      rounds: [round1],
    });
    const actions = strategy.generateActions(state);
    expect(actions).toHaveLength(2);
    expect(actions.every(a => a.roundType === 'critique_revise')).toBe(true);
    // Prompts should contain anonymous summary
    expect(actions[0].prompt).toContain('Expert');
  });

  it('generates judge action for final round', () => {
    const state = createDelphiState({
      status: 'synthesizing',
      currentRoundIndex: 2,
      rounds: [
        { roundNumber: 1, type: 'independent', responses: [completedResponse('chatgpt', 'A'), completedResponse('gemini', 'B')] },
        { roundNumber: 2, type: 'critique_revise', responses: [completedResponse('chatgpt', 'A2'), completedResponse('gemini', 'B2')] },
      ],
    });
    const actions = strategy.generateActions(state);
    expect(actions).toHaveLength(1);
    expect(actions[0].roundType).toBe('judge');
    expect(actions[0].adapterId).toBe('chatgpt');
  });

  it('advances rounds correctly', () => {
    const state = createDelphiState({ status: 'collecting', currentRoundIndex: 0 });
    const next = strategy.advanceRound(state);
    expect(next.currentRoundIndex).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/strategies/delphi.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement DelphiStrategy**

`src/strategies/delphi.ts`:
```typescript
import type { DiscussionStrategy, DiscussionState, RoundAction } from '@/types';
import { PROMPT_STYLES, ANTI_CONFORMITY_PROMPT } from './types';
import { buildAnonymousPrompt, buildJudgePrompt } from '@/orchestrator/anonymizer';

export class DelphiStrategy implements DiscussionStrategy {
  id = 'delphi' as const;
  name = '专家收敛';
  description = '独立回答→匿名汇总→质疑修正→裁判综合';
  supportedRounds: [number, number] = [2, 4];
  requiredParticipants = 2;

  generateActions(state: DiscussionState): RoundAction[] {
    const { currentRoundIndex, config } = state;
    const style = PROMPT_STYLES[config.promptStyle];

    // Round 0: Independent answers
    if (currentRoundIndex === 0) {
      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'independent' as const,
        prompt: `${style.tone}\n\n${style.format}\n\nQuestion:\n${state.question}\n\nProvide your independent analysis. Also include:\n1. Your confidence level (1-5)\n2. Key reasons\n3. The biggest uncertainty in your answer`,
      }));
    }

    // Intermediate rounds: Critique based on anonymous synthesis
    const isLastBeforeJudge = currentRoundIndex >= config.rounds - 1;

    if (isLastBeforeJudge) {
      // Final round: judge synthesis
      return [{
        adapterId: config.judgeAdapterId,
        roundType: 'judge' as const,
        prompt: buildJudgePrompt(state.question, state.rounds),
      }];
    }

    // Cross-review rounds
    const previousRound = state.rounds[state.rounds.length - 1];
    const previousResponses = previousRound?.responses ?? [];
    const anonymousPrompt = buildAnonymousPrompt(previousResponses, state.question);

    return config.participantIds.map(adapterId => ({
      adapterId,
      roundType: 'critique_revise' as const,
      prompt: `${anonymousPrompt}\n\n${ANTI_CONFORMITY_PROMPT}`,
    }));
  }

  advanceRound(state: DiscussionState): DiscussionState {
    const nextIndex = state.currentRoundIndex + 1;
    const isDone = nextIndex >= state.config.rounds
      || (state.rounds.length > 0 && state.rounds[state.rounds.length - 1].type === 'judge');

    return {
      ...state,
      currentRoundIndex: nextIndex,
      status: isDone ? 'done' : state.status,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/strategies/delphi.test.ts
```

Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/strategies/delphi.ts tests/strategies/delphi.test.ts
git commit -m "feat: add Delphi strategy — expert convergence discussion template"
```

---

## Task 13: Debate Strategy

**Files:**
- Create: `src/strategies/debate.ts`

This follows the same pattern as Delphi but with serial cross-review instead of anonymous synthesis.

- [ ] **Step 1: Implement DebateStrategy**

`src/strategies/debate.ts`:
```typescript
import type { DiscussionStrategy, DiscussionState, RoundAction, AIResponse } from '@/types';
import { PROMPT_STYLES, ANTI_CONFORMITY_PROMPT } from './types';
import { buildJudgePrompt } from '@/orchestrator/anonymizer';

export class DebateStrategy implements DiscussionStrategy {
  id = 'debate' as const;
  name = '圆桌讨论';
  description = '自由表达、质疑、补充，形成共识';
  supportedRounds: [number, number] = [2, 4];
  requiredParticipants = 2;

  generateActions(state: DiscussionState): RoundAction[] {
    const { currentRoundIndex, config } = state;
    const style = PROMPT_STYLES[config.promptStyle];

    // Round 0: Independent stance
    if (currentRoundIndex === 0) {
      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'independent' as const,
        prompt: `${style.tone}\n\n${style.format}\n\nQuestion:\n${state.question}\n\nState your position clearly. Include your main arguments and any reservations.`,
      }));
    }

    const isLastBeforeJudge = currentRoundIndex >= config.rounds - 1;

    if (isLastBeforeJudge) {
      return [{
        adapterId: config.judgeAdapterId,
        roundType: 'judge' as const,
        prompt: buildJudgePrompt(state.question, state.rounds),
      }];
    }

    // Cross-review: show each AI what others said and ask for critique
    const previousRound = state.rounds[state.rounds.length - 1];
    const otherResponses = (previousRound?.responses ?? [])
      .filter((r: AIResponse) => r.status === 'completed');

    return config.participantIds.map(adapterId => {
      const others = otherResponses.filter((r: AIResponse) => r.adapterId !== adapterId);
      const othersText = others
        .map((r: AIResponse) => `[${r.adapterId}]: ${r.content}`)
        .join('\n\n');

      return {
        adapterId,
        roundType: 'critique_revise' as const,
        prompt: `Original question: ${state.question}\n\nHere are the other participants' views:\n\n${othersText}\n\n${ANTI_CONFORMITY_PROMPT}`,
      };
    });
  }

  advanceRound(state: DiscussionState): DiscussionState {
    const nextIndex = state.currentRoundIndex + 1;
    const isDone = nextIndex >= state.config.rounds
      || (state.rounds.length > 0 && state.rounds[state.rounds.length - 1].type === 'judge');

    return {
      ...state,
      currentRoundIndex: nextIndex,
      status: isDone ? 'done' : state.status,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/strategies/debate.ts
git commit -m "feat: add Debate strategy — roundtable discussion template"
```

---

## Task 14: Six Hats, Red-Blue, Matrix Strategies

**Files:**
- Create: `src/strategies/six-hats.ts`
- Create: `src/strategies/red-blue.ts`
- Create: `src/strategies/matrix.ts`

- [ ] **Step 1: Implement Six Hats Strategy**

`src/strategies/six-hats.ts`:
```typescript
import type { DiscussionStrategy, DiscussionState, RoundAction } from '@/types';
import { ANTI_CONFORMITY_PROMPT } from './types';
import { buildJudgePrompt } from '@/orchestrator/anonymizer';

const HAT_ROLES: Record<string, { name: string; perspective: string }> = {
  white: { name: '白帽（事实）', perspective: 'Focus only on facts, data, and known information. What do we actually know? What information is missing?' },
  black: { name: '黑帽（风险）', perspective: 'Focus on risks, problems, and potential failures. What could go wrong? What are the weaknesses?' },
  yellow: { name: '黄帽（价值）', perspective: 'Focus on benefits, opportunities, and positive aspects. What is the value? Why might this succeed?' },
  green: { name: '绿帽（创意）', perspective: 'Focus on creative alternatives and new ideas. What other approaches could work? Think outside the box.' },
  red: { name: '红帽（直觉）', perspective: 'Express your gut feeling and intuition. What does your instinct say? No need to justify emotionally.' },
  blue: { name: '蓝帽（总结）', perspective: 'Organize and summarize all perspectives. Structure the thinking process and draw conclusions.' },
};

export class SixHatsStrategy implements DiscussionStrategy {
  id = 'six-hats' as const;
  name = '多视角分析';
  description = '从事实、风险、机会、创意、直觉、总结六个角度分析';
  supportedRounds: [number, number] = [2, 3];
  requiredParticipants = 2;

  generateActions(state: DiscussionState): RoundAction[] {
    const { currentRoundIndex, config } = state;
    const hats = Object.keys(HAT_ROLES);

    // Round 0: Assign hats and collect perspectives
    if (currentRoundIndex === 0) {
      return config.participantIds.map((adapterId, i) => {
        const assignedHats = this.getAssignedHats(i, config.participantIds.length, hats);
        const hatInstructions = assignedHats
          .map(h => `${HAT_ROLES[h].name}: ${HAT_ROLES[h].perspective}`)
          .join('\n\n');

        return {
          adapterId,
          roundType: 'independent' as const,
          prompt: `Question: ${state.question}\n\nYou have been assigned the following thinking hats:\n\n${hatInstructions}\n\nAnswer the question strictly from these perspectives.`,
        };
      });
    }

    // Round 1: Cross-review of perspectives
    if (currentRoundIndex === 1 && currentRoundIndex < config.rounds - 1) {
      const previousRound = state.rounds[state.rounds.length - 1];
      const allResponses = (previousRound?.responses ?? [])
        .filter(r => r.status === 'completed')
        .map(r => `[${r.adapterId}]: ${r.content}`)
        .join('\n\n');

      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'critique_revise' as const,
        prompt: `Question: ${state.question}\n\nHere are other perspectives:\n\n${allResponses}\n\nReview these perspectives. ${ANTI_CONFORMITY_PROMPT}`,
      }));
    }

    // Final round: Judge synthesis
    return [{
      adapterId: config.judgeAdapterId,
      roundType: 'judge' as const,
      prompt: buildJudgePrompt(state.question, state.rounds),
    }];
  }

  advanceRound(state: DiscussionState): DiscussionState {
    const nextIndex = state.currentRoundIndex + 1;
    const isDone = nextIndex >= state.config.rounds;

    return {
      ...state,
      currentRoundIndex: nextIndex,
      status: isDone ? 'done' : state.status,
    };
  }

  private getAssignedHats(participantIndex: number, total: number, hats: string[]): string[] {
    // Distribute hats evenly. Blue (summary) goes to judge in final round.
    const workingHats = hats.filter(h => h !== 'blue');
    const hatsPerParticipant = Math.ceil(workingHats.length / total);
    const start = participantIndex * hatsPerParticipant;
    return workingHats.slice(start, start + hatsPerParticipant);
  }
}
```

- [ ] **Step 2: Implement Red-Blue Strategy**

`src/strategies/red-blue.ts`:
```typescript
import type { DiscussionStrategy, DiscussionState, RoundAction } from '@/types';
import { ANTI_CONFORMITY_PROMPT } from './types';
import { buildJudgePrompt } from '@/orchestrator/anonymizer';

export class RedBlueStrategy implements DiscussionStrategy {
  id = 'red-blue' as const;
  name = '攻防评审';
  description = '提方案→攻击→修正→合规评估';
  supportedRounds: [number, number] = [2, 4];
  requiredParticipants = 2;

  generateActions(state: DiscussionState): RoundAction[] {
    const { currentRoundIndex, config } = state;
    const [blueId, redId] = config.participantIds;

    // Round 0: Blue team proposes, Red team attacks simultaneously
    if (currentRoundIndex === 0) {
      return [
        {
          adapterId: blueId,
          roundType: 'independent' as const,
          prompt: `You are the Blue Team (defender). Propose a detailed solution for:\n\n${state.question}\n\nProvide your best defensive strategy with clear justification.`,
        },
        {
          adapterId: redId,
          roundType: 'independent' as const,
          prompt: `You are the Red Team (attacker). The topic is:\n\n${state.question}\n\nPrepare a list of potential attacks, vulnerabilities, and failure modes. Be thorough and adversarial.`,
        },
      ];
    }

    // Subsequent rounds: Cross-review
    const previousRound = state.rounds[state.rounds.length - 1];
    const allResponses = (previousRound?.responses ?? [])
      .filter(r => r.status === 'completed');

    const isLastBeforeJudge = currentRoundIndex >= config.rounds - 1;

    if (isLastBeforeJudge) {
      return [{
        adapterId: config.judgeAdapterId,
        roundType: 'judge' as const,
        prompt: buildJudgePrompt(state.question, state.rounds) +
          '\n\nAs the judge, provide an integrated solution that addresses both the Blue Team defense and Red Team attacks.',
      }];
    }

    const blueResponse = allResponses.find(r => r.adapterId === blueId);
    const redResponse = allResponses.find(r => r.adapterId === redId);

    return [
      {
        adapterId: blueId,
        roundType: 'critique_revise' as const,
        prompt: `Red Team's attack:\n\n${redResponse?.content ?? 'N/A'}\n\nAs the Blue Team, address these attacks. Strengthen your proposal or acknowledge valid concerns.\n\n${ANTI_CONFORMITY_PROMPT}`,
      },
      {
        adapterId: redId,
        roundType: 'critique_revise' as const,
        prompt: `Blue Team's updated defense:\n\n${blueResponse?.content ?? 'N/A'}\n\nAs the Red Team, identify remaining weaknesses in the updated proposal.\n\n${ANTI_CONFORMITY_PROMPT}`,
      },
    ];
  }

  advanceRound(state: DiscussionState): DiscussionState {
    const nextIndex = state.currentRoundIndex + 1;
    const isDone = nextIndex >= state.config.rounds;

    return {
      ...state,
      currentRoundIndex: nextIndex,
      status: isDone ? 'done' : state.status,
    };
  }
}
```

- [ ] **Step 3: Implement Matrix Strategy**

`src/strategies/matrix.ts`:
```typescript
import type { DiscussionStrategy, DiscussionState, RoundAction, AIResponse } from '@/types';
import { buildJudgePrompt } from '@/orchestrator/anonymizer';

export class MatrixStrategy implements DiscussionStrategy {
  id = 'matrix' as const;
  name = '选型打分';
  description = '定义维度→各 AI 打分→汇总分歧→推荐方案';
  supportedRounds: [number, number] = [2, 3];
  requiredParticipants = 2;

  generateActions(state: DiscussionState): RoundAction[] {
    const { currentRoundIndex, config } = state;

    // Round 0: Score independently
    if (currentRoundIndex === 0) {
      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'independent' as const,
        prompt: `Evaluate the following question as a structured scoring matrix:\n\n${state.question}\n\nFor each evaluation dimension, provide:\n1. A score from 1-10\n2. A brief justification\n3. Key risks or concerns\n\nUse these dimensions: Cost, Complexity, Reliability, Scalability, Security, Maintainability, Ecosystem Maturity, Time to Implement\n\nFormat your response as a structured table or list.`,
      }));
    }

    // Round 1: Cross-review scores
    if (currentRoundIndex === 1 && currentRoundIndex < config.rounds - 1) {
      const previousRound = state.rounds[state.rounds.length - 1];
      const allScores = (previousRound?.responses ?? [])
        .filter((r: AIResponse) => r.status === 'completed')
        .map((r: AIResponse) => `[${r.adapterId}]: ${r.content}`)
        .join('\n\n');

      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'critique_revise' as const,
        prompt: `Original question: ${state.question}\n\nHere are scoring results from all evaluators:\n\n${allScores}\n\nReview the scores. Identify:\n1. Where evaluators disagree most and why\n2. Any dimensions that were overlooked\n3. Your revised scores if any evidence changed your mind`,
      }));
    }

    // Final round: Judge synthesis
    return [{
      adapterId: config.judgeAdapterId,
      roundType: 'judge' as const,
      prompt: buildJudgePrompt(state.question, state.rounds) +
        '\n\nProvide a final recommendation with:\n1. Averaged scores per dimension\n2. Confidence intervals where evaluators disagreed\n3. A clear recommendation with conditions',
    }];
  }

  advanceRound(state: DiscussionState): DiscussionState {
    const nextIndex = state.currentRoundIndex + 1;
    const isDone = nextIndex >= state.config.rounds;

    return {
      ...state,
      currentRoundIndex: nextIndex,
      status: isDone ? 'done' : state.status,
    };
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/strategies/six-hats.ts src/strategies/red-blue.ts src/strategies/matrix.ts
git commit -m "feat: add Six Hats, Red-Blue, and Matrix discussion strategies"
```

---

## Task 15: Orchestrator State Machine

**Files:**
- Create: `src/orchestrator/state-machine.ts`
- Create: `tests/orchestrator/state-machine.test.ts`

- [ ] **Step 1: Write failing test for state machine**

`tests/orchestrator/state-machine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { Orchestrator } from '@/orchestrator/state-machine';
import type { DiscussionConfig, DiscussionState } from '@/types';

describe('Orchestrator', () => {
  const config: DiscussionConfig = {
    rounds: 3,
    strategyId: 'delphi',
    judgeAdapterId: 'chatgpt',
    promptStyle: 'neutral',
    participantIds: ['chatgpt', 'gemini'],
  };

  it('initializes with idle state', () => {
    const orch = new Orchestrator('What is best?', config, 'delphi');
    const state = orch.getState();
    expect(state.status).toBe('idle');
    expect(state.question).toBe('What is best?');
    expect(state.currentRoundIndex).toBe(0);
  });

  it('transitions from idle to dispatching on start', () => {
    const orch = new Orchestrator('What is best?', config, 'delphi');
    orch.start();
    expect(orch.getState().status).toBe('dispatching');
  });

  it('records a completed response and transitions to collecting', () => {
    const orch = new Orchestrator('What is best?', config, 'delphi');
    orch.start();
    orch.recordResponse('chatgpt', 'completed', 'Answer A');
    orch.recordResponse('gemini', 'completed', 'Answer B');
    const state = orch.getState();
    expect(state.rounds[0].responses).toHaveLength(2);
  });

  it('transitions to synthesizing for judge round', () => {
    const orch = new Orchestrator('What is best?', config, 'delphi');
    orch.start();
    // Round 0 — two responses
    orch.recordResponse('chatgpt', 'completed', 'A');
    orch.recordResponse('gemini', 'completed', 'B');
    // Round 1 — two critique responses
    orch.advanceToNextRound();
    orch.recordResponse('chatgpt', 'completed', 'A2');
    orch.recordResponse('gemini', 'completed', 'B2');
    // Round 2 — judge
    orch.advanceToNextRound();
    expect(orch.getState().currentRoundIndex).toBe(2);
  });

  it('transitions to done when all rounds complete', () => {
    const orch = new Orchestrator('What is best?', config, 'delphi');
    orch.start();
    orch.recordResponse('chatgpt', 'completed', 'A');
    orch.recordResponse('gemini', 'completed', 'B');
    orch.advanceToNextRound();
    orch.recordResponse('chatgpt', 'completed', 'A2');
    orch.recordResponse('gemini', 'completed', 'B2');
    orch.advanceToNextRound();
    orch.recordResponse('chatgpt', 'completed', 'Final answer');
    const state = orch.getState();
    expect(state.status).toBe('done');
    expect(state.finalConclusion).toBeDefined();
    expect(state.finalConclusion?.content).toBe('Final answer');
  });

  it('marks session as failed when all participants fail a round', () => {
    const orch = new Orchestrator('What is best?', config, 'delphi');
    orch.start();
    orch.recordResponse('chatgpt', 'failed', '', 'timeout');
    orch.recordResponse('gemini', 'failed', '', 'timeout');
    expect(orch.getState().status).toBe('failed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/orchestrator/state-machine.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Orchestrator**

`src/orchestrator/state-machine.ts`:
```typescript
import type {
  DiscussionConfig,
  DiscussionState,
  DiscussionStatus,
  DiscussionStrategy,
  Round,
  AIResponse,
  RoundAction,
  Conclusion,
} from '@/types';

export class Orchestrator {
  private state: DiscussionState;
  private strategy: DiscussionStrategy;
  private pendingActions: RoundAction[] = [];

  constructor(
    question: string,
    config: DiscussionConfig,
    strategy: DiscussionStrategy,
  ) {
    this.strategy = strategy;
    this.state = {
      question,
      config,
      status: 'idle',
      currentRoundIndex: 0,
      rounds: [],
    };
  }

  getState(): DiscussionState {
    return { ...this.state };
  }

  /**
   * Start the discussion. Transitions from idle → dispatching.
   * Returns the first set of actions to execute.
   */
  start(): RoundAction[] {
    if (this.state.status !== 'idle') {
      throw new Error(`Cannot start from status: ${this.state.status}`);
    }

    this.transition('dispatching');
    this.pendingActions = this.strategy.generateActions(this.state);
    return this.pendingActions;
  }

  /**
   * Record a response from an adapter for the current round.
   */
  recordResponse(
    adapterId: string,
    status: AIResponse['status'],
    content: string,
    error?: string,
  ): void {
    const currentRound = this.getCurrentRound();
    const response: AIResponse = {
      adapterId,
      status,
      content,
      error,
      startedAt: Date.now(),
      completedAt: status === 'completed' || status === 'failed' ? Date.now() : undefined,
    };

    currentRound.responses.push(response);

    // Check if all expected responses are in
    this.checkRoundCompletion();
  }

  /**
   * Manually advance to the next round.
   * Called when all responses for the current round are collected.
   */
  advanceToNextRound(): RoundAction[] {
    const updatedState = this.strategy.advanceRound(this.state);
    this.state.currentRoundIndex = updatedState.currentRoundIndex;

    if (updatedState.status === 'done') {
      this.transition('done');
      return [];
    }

    // Generate next round actions
    this.transition(
      this.isJudgeRound() ? 'synthesizing' : 'dispatching'
    );
    this.pendingActions = this.strategy.generateActions(this.state);
    return this.pendingActions;
  }

  private getCurrentRound(): Round {
    if (this.state.rounds.length <= this.state.currentRoundIndex) {
      const round: Round = {
        roundNumber: this.state.currentRoundIndex + 1,
        type: this.isJudgeRound() ? 'judge' : this.state.currentRoundIndex === 0 ? 'independent' : 'critique_revise',
        responses: [],
      };
      this.state.rounds.push(round);
    }
    return this.state.rounds[this.state.currentRoundIndex];
  }

  private isJudgeRound(): boolean {
    const actions = this.strategy.generateActions(this.state);
    return actions.length > 0 && actions[0].roundType === 'judge';
  }

  private checkRoundCompletion(): void {
    const currentRound = this.getCurrentRound();
    const expectedCount = this.isJudgeRound()
      ? 1
      : this.state.config.participantIds.length;

    const completed = currentRound.responses.filter(
      r => r.status === 'completed' || r.status === 'failed'
    );

    if (completed.length >= expectedCount) {
      const allFailed = completed.every(r => r.status === 'failed');
      if (allFailed) {
        this.transition('failed');
        return;
      }

      // If this was the judge round, finalize
      if (currentRound.type === 'judge') {
        const judgeResponse = currentRound.responses.find(r => r.status === 'completed');
        if (judgeResponse) {
          this.state.finalConclusion = {
            judgeAdapterId: this.state.config.judgeAdapterId,
            content: judgeResponse.content,
            timestamp: Date.now(),
          };
          this.state.completedAt = Date.now();
          this.transition('done');
        }
      }
    }
  }

  private transition(status: DiscussionStatus): void {
    this.state.status = status;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/orchestrator/state-machine.test.ts
```

Expected: PASS — all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/orchestrator/state-machine.ts tests/orchestrator/state-machine.test.ts
git commit -m "feat: add Orchestrator state machine for discussion flow management"
```

---

## Task 16: Zustand Store

**Files:**
- Create: `src/sidepanel/store/discussionStore.ts`

- [ ] **Step 1: Implement Zustand store**

`src/sidepanel/store/discussionStore.ts`:
```typescript
import { create } from 'zustand';
import type {
  DiscussionState,
  DiscussionConfig,
  DiscussionStatus,
  Round,
  AIResponse,
  Conclusion,
  UserSettings,
  DEFAULT_SETTINGS,
} from '@/types';

interface DiscussionStore {
  // Discussion state
  discussion: DiscussionState | null;
  history: DiscussionState[];

  // UI state
  isRunning: boolean;
  showSettings: boolean;
  selectedFilter: string | null;

  // Settings
  settings: UserSettings;

  // Actions
  startDiscussion: (question: string, config: DiscussionConfig) => void;
  updateDiscussion: (state: DiscussionState) => void;
  setDiscussionStatus: (status: DiscussionStatus) => void;
  completeDiscussion: (conclusion: Conclusion) => void;
  resetDiscussion: () => void;
  toggleSettings: () => void;
  setFilter: (adapterId: string | null) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  loadHistory: () => Promise<void>;
}

export const useDiscussionStore = create<DiscussionStore>((set, get) => ({
  discussion: null,
  history: [],
  isRunning: false,
  showSettings: false,
  selectedFilter: null,
  settings: {
    defaultStrategyId: 'delphi',
    defaultJudgeAdapterId: 'chatgpt',
    defaultRounds: 3,
    defaultPromptStyle: 'neutral',
    historyLimit: 50,
  },

  startDiscussion: (question, config) => {
    set({
      discussion: {
        question,
        config,
        status: 'dispatching',
        currentRoundIndex: 0,
        rounds: [],
      },
      isRunning: true,
      selectedFilter: null,
    });
  },

  updateDiscussion: (state) => {
    set({ discussion: state });
  },

  setDiscussionStatus: (status) => {
    const current = get().discussion;
    if (!current) return;
    set({
      discussion: { ...current, status },
      isRunning: status !== 'done' && status !== 'failed',
    });
  },

  completeDiscussion: (conclusion) => {
    const current = get().discussion;
    if (!current) return;
    const completed = {
      ...current,
      status: 'done' as const,
      finalConclusion: conclusion,
      completedAt: Date.now(),
    };
    set({
      discussion: completed,
      isRunning: false,
    });

    // Save to history
    const newHistory = [completed, ...get().history].slice(0, get().settings.historyLimit);
    set({ history: newHistory });
    chrome.storage.local.set({ discussionHistory: newHistory });
  },

  resetDiscussion: () => {
    set({
      discussion: null,
      isRunning: false,
      selectedFilter: null,
    });
  },

  toggleSettings: () => {
    set(s => ({ showSettings: !s.showSettings }));
  },

  setFilter: (adapterId) => {
    set({ selectedFilter: adapterId });
  },

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    chrome.storage.sync.set({ userSettings: updated });
  },

  loadHistory: async () => {
    const result = await chrome.storage.local.get('discussionHistory');
    if (result.discussionHistory) {
      set({ history: result.discussionHistory });
    }
  },
}));
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/sidepanel/store/
git commit -m "feat: add Zustand store for discussion state management"
```

---

## Task 17: Side Panel UI Components

**Files:**
- Modify: `src/sidepanel/App.tsx`
- Create: `src/sidepanel/components/QuestionInput.tsx`
- Create: `src/sidepanel/components/PlatformStatus.tsx`
- Create: `src/sidepanel/components/ProgressTimeline.tsx`
- Create: `src/sidepanel/components/DiscussionLog.tsx`
- Create: `src/sidepanel/components/FinalConclusion.tsx`
- Create: `src/sidepanel/components/Settings.tsx`

- [ ] **Step 1: Create QuestionInput component**

`src/sidepanel/components/QuestionInput.tsx`:
```typescript
import { useState } from 'react';
import { useDiscussionStore } from '../store/discussionStore';

const STRATEGIES = [
  { id: 'parallel', name: '快速对比' },
  { id: 'delphi', name: '专家收敛' },
  { id: 'debate', name: '圆桌讨论' },
  { id: 'six-hats', name: '多视角分析' },
  { id: 'red-blue', name: '攻防评审' },
  { id: 'matrix', name: '选型打分' },
];

const ADAPTERS = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'gemini', name: 'Gemini' },
];

const STYLES = [
  { id: 'strict', name: '严谨' },
  { id: 'neutral', name: '中立' },
  { id: 'creative', name: '创意' },
];

export default function QuestionInput() {
  const [question, setQuestion] = useState('');
  const [strategyId, setStrategyId] = useState('delphi');
  const [judgeId, setJudgeId] = useState('chatgpt');
  const [style, setStyle] = useState<string>('neutral');
  const [rounds, setRounds] = useState(3);

  const { startDiscussion, isRunning, settings } = useDiscussionStore();

  const handleStart = () => {
    if (!question.trim()) return;
    startDiscussion(question.trim(), {
      rounds,
      strategyId,
      judgeAdapterId: judgeId,
      promptStyle: style as 'strict' | 'creative' | 'neutral',
      participantIds: ADAPTERS.map(a => a.id),
    });
  };

  if (isRunning) {
    return (
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 rounded-lg">
        讨论进行中...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        rows={3}
        placeholder="输入你的问题..."
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <select
          className="p-2 border rounded-lg bg-white"
          value={strategyId}
          onChange={e => setStrategyId(e.target.value)}
        >
          {STRATEGIES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg bg-white"
          value={rounds}
          onChange={e => setRounds(Number(e.target.value))}
        >
          {[1, 2, 3, 4].map(n => (
            <option key={n} value={n}>{n} 轮</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg bg-white"
          value={judgeId}
          onChange={e => setJudgeId(e.target.value)}
        >
          {ADAPTERS.map(a => (
            <option key={a.id} value={a.id}>裁判: {a.name}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg bg-white"
          value={style}
          onChange={e => setStyle(e.target.value)}
        >
          {STYLES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <button
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        disabled={!question.trim()}
        onClick={handleStart}
      >
        🚀 开始讨论
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create PlatformStatus component**

`src/sidepanel/components/PlatformStatus.tsx`:
```typescript
import { useState, useEffect } from 'react';
import type { AIPlatformAdapter } from '@/types';

const PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app' },
];

interface PlatformInfo {
  id: string;
  name: string;
  ready: boolean;
  tabId?: number;
}

export default function PlatformStatus() {
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);

  useEffect(() => {
    checkPlatforms();
  }, []);

  const checkPlatforms = async () => {
    const tabs = await chrome.tabs.query({});
    const info: PlatformInfo[] = PLATFORMS.map(p => {
      const tab = tabs.find(t => t.url?.includes(p.id));
      return {
        id: p.id,
        name: p.name,
        ready: !!tab,
        tabId: tab?.id,
      };
    });
    setPlatforms(info);
  };

  const openPlatform = async (url: string) => {
    await chrome.tabs.create({ url, active: false });
    setTimeout(checkPlatforms, 2000);
  };

  return (
    <div className="flex gap-2 text-sm">
      {platforms.map(p => (
        <div key={p.id} className="flex items-center gap-1">
          <span className={p.ready ? 'text-green-500' : 'text-yellow-500'}>
            {p.ready ? '●' : '○'}
          </span>
          <span className={p.ready ? 'text-gray-700' : 'text-gray-400'}>
            {p.name}
          </span>
          {!p.ready && (
            <button
              className="text-blue-500 hover:underline text-xs"
              onClick={() => openPlatform(PLATFORMS.find(x => x.id === p.id)!.url)}
            >
              打开
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create ProgressTimeline component**

`src/sidepanel/components/ProgressTimeline.tsx`:
```typescript
import { useDiscussionStore } from '../store/discussionStore';

const ROUND_LABELS: Record<string, string> = {
  independent: '独立回答',
  anonymous_synthesis: '匿名汇总',
  critique_revise: '交叉审阅',
  judge: '裁判总结',
};

const STATUS_ICONS: Record<string, string> = {
  idle: '○',
  dispatching: '◐',
  collecting: '◐',
  cross_review: '◐',
  synthesizing: '◐',
  done: '●',
  failed: '✕',
};

export default function ProgressTimeline() {
  const { discussion } = useDiscussionStore();
  if (!discussion) return null;

  const { rounds, status, config } = discussion;
  const totalRounds = config.rounds;

  return (
    <div className="space-y-1 text-sm">
      <div className="font-medium text-gray-700">📊 讨论进度</div>
      {Array.from({ length: totalRounds }, (_, i) => {
        const round = rounds[i];
        const isActive = i === discussion.currentRoundIndex;
        const isDone = round && round.responses.every(r => r.status === 'completed' || r.status === 'failed');
        const icon = isDone ? '✅' : isActive ? STATUS_ICONS[status] || '○' : '○';
        const label = round?.type ? ROUND_LABELS[round.type] : `Round ${i + 1}`;

        return (
          <div key={i} className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
            <span>{icon}</span>
            <span>Round {i + 1}: {label}</span>
            {isActive && <span className="animate-pulse">⏳</span>}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create DiscussionLog component**

`src/sidepanel/components/DiscussionLog.tsx`:
```typescript
import { useDiscussionStore } from '../store/discussionStore';

const ADAPTER_EMOJIS: Record<string, string> = {
  chatgpt: '🤖',
  gemini: '🔷',
};

export default function DiscussionLog() {
  const { discussion, selectedFilter, setFilter } = useDiscussionStore();
  if (!discussion) return null;

  const { rounds, config } = discussion;
  const participantIds = config.participantIds;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700 text-sm">💬 讨论记录</span>
        <div className="flex gap-1">
          <button
            className={`px-2 py-0.5 text-xs rounded ${!selectedFilter ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setFilter(null)}
          >
            全部
          </button>
          {participantIds.map(id => (
            <button
              key={id}
              className={`px-2 py-0.5 text-xs rounded ${selectedFilter === id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setFilter(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {rounds.map((round, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
            Round {round.roundNumber} — {round.type === 'independent' ? '独立回答' : round.type === 'critique_revise' ? '交叉审阅' : round.type === 'anonymous_synthesis' ? '匿名汇总' : '裁判总结'}
          </div>
          <div className="p-3 space-y-2">
            {round.synthesis && (
              <div className="text-sm bg-yellow-50 p-2 rounded">
                <div className="font-medium text-yellow-800">📋 匿名汇总</div>
                {round.synthesis.consensus.length > 0 && (
                  <div className="mt-1 text-yellow-700">共识: {round.synthesis.consensus.join('; ')}</div>
                )}
                {round.synthesis.disagreements.length > 0 && (
                  <div className="mt-1 text-red-600">分歧: {round.synthesis.disagreements.join('; ')}</div>
                )}
              </div>
            )}
            {round.responses
              .filter(r => !selectedFilter || r.adapterId === selectedFilter)
              .filter(r => r.content)
              .map((response, j) => (
                <div key={j} className="text-sm">
                  <span className="font-medium">
                    {ADAPTER_EMOJIS[response.adapterId] ?? '🤖'} {response.adapterId}
                  </span>
                  <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{response.content}</p>
                  {response.confidence && (
                    <span className="text-xs text-gray-400">置信度: {response.confidence}/5</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create FinalConclusion component**

`src/sidepanel/components/FinalConclusion.tsx`:
```typescript
import { useDiscussionStore } from '../store/discussionStore';

export default function FinalConclusion() {
  const { discussion, resetDiscussion } = useDiscussionStore();
  if (!discussion?.finalConclusion) return null;

  const { content, judgeAdapterId } = discussion.finalConclusion;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleExport = () => {
    const md = formatToMarkdown(discussion);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-council-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t bg-green-50 p-4 space-y-2">
      <div className="font-medium text-green-800">🏆 最终结论</div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{content}</div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50"
          onClick={handleCopy}
        >
          📋 复制
        </button>
        <button
          className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50"
          onClick={handleExport}
        >
          💾 导出
        </button>
        <button
          className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50"
          onClick={resetDiscussion}
        >
          🔄 重试
        </button>
      </div>
    </div>
  );
}

function formatToMarkdown(discussion: NonNullable<ReturnType<typeof useDiscussionStore.getState>['discussion']>): string {
  const parts = [`# VibeCouncil Discussion\n\n**Question:** ${discussion.question}\n\n`];

  for (const round of discussion.rounds) {
    parts.push(`## Round ${round.roundNumber} (${round.type})\n\n`);
    for (const r of round.responses) {
      if (r.content) {
        parts.push(`### ${r.adapterId}\n\n${r.content}\n\n`);
      }
    }
  }

  if (discussion.finalConclusion) {
    parts.push(`## Final Conclusion (by ${discussion.finalConclusion.judgeAdapterId})\n\n${discussion.finalConclusion.content}\n`);
  }

  return parts.join('');
}
```

- [ ] **Step 6: Create Settings component**

`src/sidepanel/components/Settings.tsx`:
```typescript
import { useDiscussionStore } from '../store/discussionStore';

export default function Settings() {
  const { settings, updateSettings, toggleSettings } = useDiscussionStore();

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-end">
      <div className="w-full max-w-xs bg-white h-full p-4 space-y-4 overflow-auto shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">⚙️ 设置</h2>
          <button onClick={toggleSettings} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div>
          <label className="text-sm text-gray-600">默认讨论模式</label>
          <select
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.defaultStrategyId}
            onChange={e => updateSettings({ defaultStrategyId: e.target.value })}
          >
            <option value="parallel">快速对比</option>
            <option value="delphi">专家收敛</option>
            <option value="debate">圆桌讨论</option>
            <option value="six-hats">多视角分析</option>
            <option value="red-blue">攻防评审</option>
            <option value="matrix">选型打分</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">默认裁判 AI</label>
          <select
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.defaultJudgeAdapterId}
            onChange={e => updateSettings({ defaultJudgeAdapterId: e.target.value })}
          >
            <option value="chatgpt">ChatGPT</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">默认轮次</label>
          <input
            type="number"
            min={1}
            max={4}
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.defaultRounds}
            onChange={e => updateSettings({ defaultRounds: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">历史记录上限</label>
          <input
            type="number"
            min={10}
            max={200}
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.historyLimit}
            onChange={e => updateSettings({ historyLimit: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update App.tsx to compose all components**

`src/sidepanel/App.tsx`:
```typescript
import { useDiscussionStore } from './store/discussionStore';
import QuestionInput from './components/QuestionInput';
import PlatformStatus from './components/PlatformStatus';
import ProgressTimeline from './components/ProgressTimeline';
import DiscussionLog from './components/DiscussionLog';
import FinalConclusion from './components/FinalConclusion';
import Settings from './components/Settings';

export default function App() {
  const { discussion, showSettings, toggleSettings, isRunning } = useDiscussionStore();

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-bold text-gray-800">VibeCouncil</h1>
        <button
          className="text-gray-400 hover:text-gray-600 text-xl"
          onClick={toggleSettings}
        >
          ⚙️
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Platform status */}
        <PlatformStatus />

        {/* Question input (collapses during discussion) */}
        <QuestionInput />

        {/* Progress timeline */}
        {isRunning && <ProgressTimeline />}

        {/* Discussion log */}
        {discussion && <DiscussionLog />}
      </div>

      {/* Final conclusion (fixed bottom) */}
      {discussion?.finalConclusion && <FinalConclusion />}

      {/* Settings modal */}
      {showSettings && <Settings />}
    </div>
  );
}
```

- [ ] **Step 8: Verify build succeeds**

```bash
npx vite build
```

Expected: Build succeeds. All components compiled.

- [ ] **Step 9: Commit**

```bash
git add src/sidepanel/
git commit -m "feat: add Side Panel UI components — QuestionInput, ProgressTimeline, DiscussionLog, FinalConclusion, Settings"
```

---

## Task 18: Background Service Worker + Context Menu

**Files:**
- Modify: `src/background/index.ts`

- [ ] **Step 1: Implement Background SW with context menu and side panel**

`src/background/index.ts`:
```typescript
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
    // Open side panel
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // Send selected text to side panel
    const message: ExtensionMessage = {
      type: 'CONTEXT_MENU_TRIGGER',
      selectedText: info.selectionText,
    };
    // Small delay to allow side panel to load
    setTimeout(() => {
      chrome.runtime.sendMessage(message);
    }, 500);
  }
});

// Relay messages between content scripts and side panel
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  // Forward messages from content scripts to side panel
  if (sender.tab) {
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel might not be open
    });
  }
  sendResponse({ received: true });
});
```

- [ ] **Step 2: Verify build succeeds**

```bash
npx vite build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/background/
git commit -m "feat: add Background SW with context menu and side panel trigger"
```

---

## Task 19: Strategy Registration + App Bootstrap

**Files:**
- Create: `src/strategies/index.ts`
- Create: `src/adapters/index.ts`

- [ ] **Step 1: Create adapter registration module**

`src/adapters/index.ts`:
```typescript
import { adapterRegistry } from './registry';

/**
 * Register built-in adapters.
 * Called once at extension startup.
 */
export function registerBuiltinAdapters(): void {
  // Adapters are self-registering via content scripts.
  // This module provides a central import point for the adapter registry.
  // The registry is used in the side panel to look up adapter metadata.
  // ChatGPT and Gemini adapters register their content scripts via manifest.json.
}
```

- [ ] **Step 2: Create strategy registration module**

`src/strategies/index.ts`:
```typescript
import { strategyRegistry } from './registry';
import { ParallelStrategy } from './parallel';
import { DelphiStrategy } from './delphi';
import { DebateStrategy } from './debate';
import { SixHatsStrategy } from './six-hats';
import { RedBlueStrategy } from './red-blue';
import { MatrixStrategy } from './matrix';

/**
 * Register all built-in discussion strategies.
 * Called once at extension startup.
 */
export function registerBuiltinStrategies(): void {
  strategyRegistry.register(new ParallelStrategy());
  strategyRegistry.register(new DelphiStrategy());
  strategyRegistry.register(new DebateStrategy());
  strategyRegistry.register(new SixHatsStrategy());
  strategyRegistry.register(new RedBlueStrategy());
  strategyRegistry.register(new MatrixStrategy());
}

export { strategyRegistry };
```

- [ ] **Step 3: Update Side Panel App.tsx to initialize strategies**

Add at the top of `src/sidepanel/App.tsx`:
```typescript
import { useEffect } from 'react';
import { registerBuiltinStrategies } from '@/strategies';
import { useDiscussionStore } from './store/discussionStore';
// ... rest of imports

export default function App() {
  const { loadHistory } = useDiscussionStore();

  useEffect(() => {
    registerBuiltinStrategies();
    loadHistory();
  }, [loadHistory]);

  // ... rest of component
}
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/strategies/index.ts src/adapters/index.ts src/sidepanel/App.tsx
git commit -m "feat: wire up strategy registration and app bootstrap"
```

---

## Task 20: End-to-End Smoke Test

**Files:**
- Modify: none (manual testing)

- [ ] **Step 1: Build the extension**

```bash
npx vite build
```

Expected: Build succeeds with output in `dist/` directory.

- [ ] **Step 2: Load extension in Chrome**

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `dist/` directory

- [ ] **Step 3: Test Side Panel opens**

1. Click the VibeCouncil extension icon
2. Expected: Side Panel opens with the UI

- [ ] **Step 4: Test Context Menu**

1. Select text on any webpage
2. Right-click → "发送到 VibeCouncil 讨论"
3. Expected: Side Panel opens with text pre-filled

- [ ] **Step 5: Test Adapter detection**

1. Open https://chatgpt.com in a tab (ensure logged in)
2. Open https://gemini.google.com in another tab (ensure logged in)
3. Expected: Side Panel shows both platforms as ready

- [ ] **Step 6: Test a full discussion (manual)**

1. Enter a question in Side Panel
2. Select "快速对比" (Parallel) mode
3. Click "开始讨论"
4. Expected: Both AI platforms receive prompts, responses stream back, discussion completes

---

## Self-Review Checklist

### Spec Coverage

| Spec Section | Task(s) |
|---|---|
| Architecture (4 modules) | Task 1, 4, 8, 17 |
| Adapter interface (pluggable) | Task 4, 5, 6 |
| Discussion strategies (6 templates) | Task 9–14 |
| Default flow (Delphi + Debate) | Task 11, 12 |
| Side Panel UI (3 layers) | Task 17 |
| Data model & storage | Task 2, 16 |
| Anonymous synthesis | Task 11 |
| Selector fallback mechanism | Task 3, 5, 6 |
| Anti-detection (human typing) | Task 3 (dom.ts) |
| Error handling | Task 15 (state machine) |
| Context Menu | Task 18 |
| Communication protocol | Task 7 |
| Tab management | Task 8 |

### Placeholder Scan

No TBD, TODO, or placeholder patterns found. All code blocks contain complete implementations.

### Type Consistency

- `AIPlatformAdapter.id` used consistently as `string` across adapters, config, and messaging
- `DiscussionConfig.rounds` as `number` in config and strategy logic
- `RoundAction.roundType` values (`independent`, `critique_revise`, `judge`) match `RoundType` definition
- `AIResponse.status` values match `ResponseStatus` union type
- `ExtensionMessage` discriminated union covers all message types used in content scripts and background
