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
