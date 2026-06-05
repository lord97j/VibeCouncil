import { create } from 'zustand';
import type {
  DiscussionState,
  DiscussionConfig,
  DiscussionStatus,
  Conclusion,
  UserSettings,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { DiscussionController } from './discussionController';

interface DiscussionStore {
  discussion: DiscussionState | null;
  history: DiscussionState[];
  isRunning: boolean;
  showSettings: boolean;
  selectedFilter: string | null;
  settings: UserSettings;

  startDiscussion: (question: string, config: DiscussionConfig) => Promise<void>;
  updateDiscussion: (state: DiscussionState) => void;
  setDiscussionStatus: (status: DiscussionStatus) => void;
  completeDiscussion: (conclusion: Conclusion) => void;
  resetDiscussion: () => void;
  toggleSettings: () => void;
  setFilter: (adapterId: string | null) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  loadHistory: () => Promise<void>;
}

let activeController: DiscussionController | null = null;

export const useDiscussionStore = create<DiscussionStore>((set, get) => ({
  discussion: null,
  history: [],
  isRunning: false,
  showSettings: false,
  selectedFilter: null,
  settings: { ...DEFAULT_SETTINGS },

  startDiscussion: async (question, config) => {
    try {
      // Clean up any previous controller
      if (activeController) {
        try { activeController.cleanup(); } catch {}
      }

      // Set initial state
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

      // Create and start the controller
      const controller = new DiscussionController(
        // onUpdate: sync Orchestrator state to store
        (state: DiscussionState) => {
          set({ discussion: state });
        },
        // onComplete: finalize discussion
        (state: DiscussionState) => {
          const conclusion: Conclusion | undefined = state.finalConclusion;
          if (conclusion) {
            get().completeDiscussion(conclusion);
          } else {
            set({
              discussion: state,
              isRunning: state.status !== 'done' && state.status !== 'failed',
            });
          }
        },
      );
      activeController = controller;

      await controller.start(question, config);
    } catch (err) {
      console.error('[VibeCouncil] Failed to start discussion:', err);
      set({
        discussion: {
          ...get().discussion!,
          status: 'failed',
        },
        isRunning: false,
      });
    }
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

    if (activeController) {
      activeController.cleanup();
      activeController = null;
    }

    const newHistory = [completed, ...get().history].slice(0, get().settings.historyLimit);
    set({ history: newHistory });
    chrome.storage.local.set({ discussionHistory: newHistory });
  },

  resetDiscussion: () => {
    if (activeController) {
      activeController.cleanup();
      activeController = null;
    }
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
      set({ history: result.discussionHistory as DiscussionState[] });
    }
  },
}));
