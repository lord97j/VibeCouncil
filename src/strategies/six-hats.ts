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
    const workingHats = hats.filter(h => h !== 'blue');
    const hatsPerParticipant = Math.ceil(workingHats.length / total);
    const start = participantIndex * hatsPerParticipant;
    return workingHats.slice(start, start + hatsPerParticipant);
  }
}
