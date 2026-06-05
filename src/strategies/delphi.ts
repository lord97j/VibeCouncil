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

    if (currentRoundIndex === 0) {
      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'independent' as const,
        prompt: `${style.tone}\n\n${style.format}\n\nQuestion:\n${state.question}\n\nProvide your independent analysis. Also include:\n1. Your confidence level (1-5)\n2. Key reasons\n3. The biggest uncertainty in your answer`,
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
