import { describe, it, expect } from 'vitest';
import {
  extractKeySentences,
  findConsensus,
  findDisagreements,
  formatSynthesis,
} from '@/utils/text';

describe('extractKeySentences', () => {
  it('splits text into sentences and returns them', () => {
    const text = 'First point. Second point. Third point.';
    const sentences = extractKeySentences(text);
    expect(sentences).toHaveLength(3);
    expect(sentences[0]).toBe('First point.');
  });

  it('filters out very short sentences', () => {
    const text = 'OK. This is a real sentence with enough content.';
    const sentences = extractKeySentences(text);
    expect(sentences).toHaveLength(1);
  });
});

describe('findConsensus', () => {
  it('finds shared keywords across responses', () => {
    const responses = [
      'TypeScript offers strong type safety for large projects.',
      'TypeScript provides type safety and better tooling.',
    ];
    const consensus = findConsensus(responses);
    expect(consensus.length).toBeGreaterThan(0);
    expect(consensus.some(c => c.toLowerCase().includes('typescript'))).toBe(true);
  });

  it('returns empty for unrelated responses', () => {
    const responses = [
      'The weather is nice today.',
      'React 19 was released recently.',
    ];
    const consensus = findConsensus(responses);
    expect(consensus).toEqual([]);
  });
});

describe('findDisagreements', () => {
  it('identifies contrasting positions', () => {
    const responses = [
      'I strongly recommend using microservices for this project.',
      'Monolithic architecture is the better choice here.',
    ];
    const disagreements = findDisagreements(responses);
    expect(disagreements.length).toBeGreaterThan(0);
  });
});

describe('formatSynthesis', () => {
  it('formats synthesis into structured text', () => {
    const text = formatSynthesis(
      ['TypeScript is widely adopted.', 'Both agree on type safety.'],
      ['One prefers microservices, the other prefers monolith.'],
      ['Cost analysis was not discussed.'],
    );
    expect(text).toContain('Consensus');
    expect(text).toContain('Disagreements');
    expect(text).toContain('Gaps');
  });
});
