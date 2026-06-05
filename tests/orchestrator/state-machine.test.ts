import { describe, it, expect } from 'vitest';
import { Orchestrator } from '@/orchestrator/state-machine';
import { DelphiStrategy } from '@/strategies/delphi';
import type { DiscussionConfig, DiscussionState } from '@/types';

describe('Orchestrator', () => {
  const config: DiscussionConfig = {
    rounds: 3,
    strategyId: 'delphi',
    judgeAdapterId: 'chatgpt',
    promptStyle: 'neutral',
    participantIds: ['chatgpt', 'gemini'],
  };
  const strategy = new DelphiStrategy();

  it('initializes with idle state', () => {
    const orch = new Orchestrator('What is best?', config, strategy);
    const state = orch.getState();
    expect(state.status).toBe('idle');
    expect(state.question).toBe('What is best?');
    expect(state.currentRoundIndex).toBe(0);
  });

  it('transitions from idle to dispatching on start', () => {
    const orch = new Orchestrator('What is best?', config, strategy);
    orch.start();
    expect(orch.getState().status).toBe('dispatching');
  });

  it('records completed responses', () => {
    const orch = new Orchestrator('What is best?', config, strategy);
    orch.start();
    orch.recordResponse('chatgpt', 'completed', 'Answer A');
    orch.recordResponse('gemini', 'completed', 'Answer B');
    const state = orch.getState();
    expect(state.rounds[0].responses).toHaveLength(2);
  });

  it('advances to synthesizing for judge round', () => {
    const orch = new Orchestrator('What is best?', config, strategy);
    orch.start();
    orch.recordResponse('chatgpt', 'completed', 'A');
    orch.recordResponse('gemini', 'completed', 'B');
    orch.advanceToNextRound();
    orch.recordResponse('chatgpt', 'completed', 'A2');
    orch.recordResponse('gemini', 'completed', 'B2');
    orch.advanceToNextRound();
    expect(orch.getState().currentRoundIndex).toBe(2);
  });

  it('transitions to done when judge completes', () => {
    const orch = new Orchestrator('What is best?', config, strategy);
    orch.start();
    orch.recordResponse('chatgpt', 'completed', 'A');
    orch.recordResponse('gemini', 'completed', 'B');
    orch.advanceToNextRound();
    orch.recordResponse('chatgpt', 'completed', 'A2');
    orch.recordResponse('gemini', 'completed', 'B2');
    orch.advanceToNextRound();
    orch.recordResponse('chatgpt', 'completed', 'Final answer');
    const state = orch.getState();
    expect(state.status).toBe('done');
    expect(state.finalConclusion).toBeDefined();
    expect(state.finalConclusion?.content).toBe('Final answer');
  });

  it('marks session as failed when all participants fail', () => {
    const orch = new Orchestrator('What is best?', config, strategy);
    orch.start();
    orch.recordResponse('chatgpt', 'failed', '', 'timeout');
    orch.recordResponse('gemini', 'failed', '', 'timeout');
    expect(orch.getState().status).toBe('failed');
  });
});
