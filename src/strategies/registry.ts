import type { DiscussionStrategy } from '@/types';

export class StrategyRegistry {
  private strategies = new Map<string, DiscussionStrategy>();

  register(strategy: DiscussionStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  get(id: string): DiscussionStrategy | undefined {
    return this.strategies.get(id);
  }

  getAll(): DiscussionStrategy[] {
    return [...this.strategies.values()].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
  }

  clear(): void {
    this.strategies.clear();
  }
}

/** Global singleton registry */
export const strategyRegistry = new StrategyRegistry();
