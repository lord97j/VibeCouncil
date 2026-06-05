import { describe, it, expect, beforeEach } from 'vitest';
import { StrategyRegistry } from '@/strategies/registry';
import type { DiscussionStrategy } from '@/types';

function createMockStrategy(id: string): DiscussionStrategy {
  return {
    id,
    name: `Strategy ${id}`,
    description: `Description for ${id}`,
    supportedRounds: [2, 4],
    requiredParticipants: 2,
    generateActions: vi.fn().mockReturnValue([]),
    advanceRound: vi.fn().mockReturnValue({} as any),
  };
}

describe('StrategyRegistry', () => {
  let registry: StrategyRegistry;

  beforeEach(() => {
    registry = new StrategyRegistry();
  });

  it('registers and retrieves a strategy', () => {
    const strategy = createMockStrategy('delphi');
    registry.register(strategy);
    expect(registry.get('delphi')).toBe(strategy);
  });

  it('returns all registered strategies', () => {
    registry.register(createMockStrategy('a'));
    registry.register(createMockStrategy('b'));
    expect(registry.getAll()).toHaveLength(2);
  });

  it('returns undefined for unknown strategy', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('returns strategies sorted by id', () => {
    registry.register(createMockStrategy('debate'));
    registry.register(createMockStrategy('parallel'));
    registry.register(createMockStrategy('delphi'));
    const ids = registry.getAll().map(s => s.id);
    expect(ids).toEqual(['debate', 'delphi', 'parallel']);
  });
});
