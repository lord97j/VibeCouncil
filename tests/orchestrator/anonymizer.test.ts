import { describe, it, expect } from 'vitest';
import { anonymizeResponses, buildAnonymousPrompt } from '@/orchestrator/anonymizer';
import type { AIResponse } from '@/types';

describe('anonymizeResponses', () => {
  it('strips adapter identifiers from responses', () => {
    const responses: AIResponse[] = [
      { adapterId: 'chatgpt', status: 'completed', content: 'I think TypeScript is best because of type safety for large projects.', startedAt: 0 },
      { adapterId: 'gemini', status: 'completed', content: 'I think TypeScript is best because of type safety for large projects. But also consider Python for scripting.', startedAt: 0 },
    ];
    const result = anonymizeResponses(responses);
    expect(result.texts).toHaveLength(2);
    expect(result.texts[0]).not.toContain('chatgpt');
    expect(result.texts[1]).not.toContain('gemini');
    expect(result.synthesis.consensus.length).toBeGreaterThan(0);
  });

  it('handles single response', () => {
    const responses: AIResponse[] = [
      { adapterId: 'chatgpt', status: 'completed', content: 'Some answer with enough content to be meaningful.', startedAt: 0 },
    ];
    const result = anonymizeResponses(responses);
    expect(result.texts).toHaveLength(1);
  });
});

describe('buildAnonymousPrompt', () => {
  it('formats a prompt from anonymized responses', () => {
    const responses: AIResponse[] = [
      { adapterId: 'chatgpt', status: 'completed', content: 'Use microservices for scalability and team independence.', startedAt: 0 },
      { adapterId: 'gemini', status: 'completed', content: 'Use monolith for simplicity and faster development cycles.', startedAt: 0 },
    ];
    const prompt = buildAnonymousPrompt(responses, 'What architecture to use?');
    expect(prompt).toContain('Expert 1');
    expect(prompt).toContain('Expert 2');
    expect(prompt).not.toContain('chatgpt');
    expect(prompt).not.toContain('gemini');
    expect(prompt).toContain('review');
  });
});
