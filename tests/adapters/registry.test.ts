import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistry } from '@/adapters/registry';
import type { AIPlatformAdapter } from '@/types';

function createMockAdapter(id: string): AIPlatformAdapter {
  return {
    id,
    name: `Mock ${id}`,
    hostPattern: `*://${id}.com/*`,
    defaultUrl: `https://${id}.com`,
    sendPrompt: vi.fn().mockResolvedValue(undefined),
    waitForResponse: vi.fn().mockResolvedValue('mock response'),
    isReady: vi.fn().mockResolvedValue(true),
  };
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  it('registers and retrieves an adapter', () => {
    const adapter = createMockAdapter('test-ai');
    registry.register(adapter);
    expect(registry.get('test-ai')).toBe(adapter);
  });

  it('returns all registered adapters', () => {
    registry.register(createMockAdapter('a'));
    registry.register(createMockAdapter('b'));
    expect(registry.getAll()).toHaveLength(2);
  });

  it('returns undefined for unregistered adapter', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('filters adapters by host pattern', () => {
    registry.register(createMockAdapter('chatgpt'));
    registry.register(createMockAdapter('gemini'));
    const result = registry.findByHost('https://chatgpt.com/chat');
    expect(result?.id).toBe('chatgpt');
  });

  it('overwrites on duplicate registration', () => {
    registry.register(createMockAdapter('x'));
    const updated = createMockAdapter('x');
    updated.name = 'Updated X';
    registry.register(updated);
    expect(registry.get('x')?.name).toBe('Updated X');
    expect(registry.getAll()).toHaveLength(1);
  });
});
