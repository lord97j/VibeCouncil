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
