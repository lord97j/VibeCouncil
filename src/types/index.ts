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
  completedAt?: number;
}

// ============================================================
// Messaging types
// ============================================================

export type ExtensionMessage =
  | { type: 'PING' }
  | { type: 'PONG'; adapterId: string }
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
