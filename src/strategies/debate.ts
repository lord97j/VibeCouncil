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
