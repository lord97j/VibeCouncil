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
