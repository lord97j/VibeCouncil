import type {
  DiscussionConfig,
  DiscussionState,
  DiscussionStatus,
  DiscussionStrategy,
  Round,
  AIResponse,
  RoundAction,
} from '@/types';

export class Orchestrator {
  private state: DiscussionState;
  private strategy: DiscussionStrategy;
  private pendingActions: RoundAction[] = [];

  constructor(
    question: string,
    config: DiscussionConfig,
    strategy: DiscussionStrategy,
  ) {
    this.strategy = strategy;
    this.state = {
      question,
      config,
      status: 'idle',
      currentRoundIndex: 0,
      rounds: [],
    };
  }

  getState(): DiscussionState {
    return { ...this.state };
  }

  /**
   * Start the discussion. Transitions from idle → dispatching.
   */
  start(): RoundAction[] {
    if (this.state.status !== 'idle') {
      throw new Error(`Cannot start from status: ${this.state.status}`);
    }

    this.transition('dispatching');
    this.pendingActions = this.strategy.generateActions(this.state);
    return this.pendingActions;
  }

  /**
   * Record a response from an adapter for the current round.
   */
  recordResponse(
    adapterId: string,
    status: AIResponse['status'],
    content: string,
    error?: string,
  ): void {
    const currentRound = this.ensureCurrentRound();
    const response: AIResponse = {
      adapterId,
      status,
      content,
      error,
      startedAt: Date.now(),
      completedAt: status === 'completed' || status === 'failed' ? Date.now() : undefined,
    };

    currentRound.responses.push(response);
    this.checkRoundCompletion();
  }

  /**
   * Advance to the next round.
   */
  advanceToNextRound(): RoundAction[] {
    const updatedState = this.strategy.advanceRound(this.state);
    this.state.currentRoundIndex = updatedState.currentRoundIndex;

    if (updatedState.status === 'done') {
      this.transition('done');
      return [];
    }

    this.transition(
      this.isJudgeRound() ? 'synthesizing' : 'dispatching'
    );
    this.pendingActions = this.strategy.generateActions(this.state);
    return this.pendingActions;
  }

  private ensureCurrentRound(): Round {
    if (this.state.rounds.length <= this.state.currentRoundIndex) {
      const round: Round = {
        roundNumber: this.state.currentRoundIndex + 1,
        type: this.isJudgeRound() ? 'judge' : this.state.currentRoundIndex === 0 ? 'independent' : 'critique_revise',
        responses: [],
      };
      this.state.rounds.push(round);
    }
    return this.state.rounds[this.state.currentRoundIndex];
  }

  private isJudgeRound(): boolean {
    const actions = this.strategy.generateActions(this.state);
    return actions.length > 0 && actions[0].roundType === 'judge';
  }

  private checkRoundCompletion(): void {
    const currentRound = this.state.rounds[this.state.currentRoundIndex];
    if (!currentRound) return;

    const expectedCount = currentRound.type === 'judge'
      ? 1
      : this.state.config.participantIds.length;

    const completed = currentRound.responses.filter(
      r => r.status === 'completed' || r.status === 'failed'
    );

    if (completed.length >= expectedCount) {
      const allFailed = completed.every(r => r.status === 'failed');
      if (allFailed) {
        this.transition('failed');
        return;
      }

      if (currentRound.type === 'judge') {
        const judgeResponse = currentRound.responses.find(r => r.status === 'completed');
        if (judgeResponse) {
          this.state.finalConclusion = {
            judgeAdapterId: this.state.config.judgeAdapterId,
            content: judgeResponse.content,
            timestamp: Date.now(),
          };
          this.state.completedAt = Date.now();
          this.transition('done');
        }
      }
    }
  }

  private transition(status: DiscussionStatus): void {
    this.state.status = status;
  }
}
