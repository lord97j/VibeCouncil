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
