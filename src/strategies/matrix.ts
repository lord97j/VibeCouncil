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

    if (currentRoundIndex === 0) {
      return config.participantIds.map(adapterId => ({
        adapterId,
        roundType: 'independent' as const,
        prompt: `Evaluate the following question as a structured scoring matrix:\n\n${state.question}\n\nFor each evaluation dimension, provide:\n1. A score from 1-10\n2. A brief justification\n3. Key risks or concerns\n\nUse these dimensions: Cost, Complexity, Reliability, Scalability, Security, Maintainability, Ecosystem Maturity, Time to Implement\n\nFormat your response as a structured table or list.`,
      }));
    }

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
