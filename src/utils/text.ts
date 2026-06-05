import type { AnonymousSynthesis } from '@/types';

/** Minimum sentence length (characters) to be considered a key sentence. */
const MIN_SENTENCE_LENGTH = 10;

/**
 * Split text into sentences, filtering trivially short ones.
 */
export function extractKeySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= MIN_SENTENCE_LENGTH);
}

/** Extract significant words from text (lowercased, no stop words). */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
    'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
    'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what',
    'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me',
    'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
    'it', 'its', 'they', 'them', 'their',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Find shared topics between responses based on overlapping significant tokens.
 */
export function findConsensus(responses: string[]): string[] {
  if (responses.length < 2) return [];

  const tokenSets = responses.map(r => new Set(tokenize(r)));
  const allTokens = tokenSets.flatMap(set => [...set]);

  const sharedTokens = [...new Set(allTokens)].filter(token =>
    tokenSets.every(set => set.has(token))
  );

  const consensus: string[] = [];
  const allSentences = responses.flatMap(extractKeySentences);

  for (const token of sharedTokens.slice(0, 5)) {
    const matching = allSentences.find(s =>
      s.toLowerCase().includes(token)
    );
    if (matching && !consensus.includes(matching)) {
      consensus.push(matching);
    }
  }

  return consensus;
}

/**
 * Detect disagreements by looking for contrast patterns and opposing keywords.
 */
export function findDisagreements(responses: string[]): string[] {
  if (responses.length < 2) return [];

  const contrastPatterns = [
    /\b(recommend|prefer|should|best|better|right|correct)\b/i,
    /\b(against|disagree|wrong|bad|worse|avoid|don't|shouldn't)\b/i,
  ];

  const sentences = responses.flatMap(extractKeySentences);
  const disagreements: string[] = [];

  for (const sentence of sentences) {
    if (disagreements.length >= 5) break;
    const hasContrast = contrastPatterns.some(p => p.test(sentence));
    if (hasContrast) {
      disagreements.push(sentence);
    }
  }

  return disagreements;
}

/**
 * Format synthesis components into a structured text for the next AI round.
 */
export function formatSynthesis(
  consensus: string[],
  disagreements: string[],
  gaps: string[],
): string {
  const parts: string[] = [];

  if (consensus.length > 0) {
    parts.push(`Consensus:\n${consensus.map(c => `- ${c}`).join('\n')}`);
  }
  if (disagreements.length > 0) {
    parts.push(`Disagreements:\n${disagreements.map(d => `- ${d}`).join('\n')}`);
  }
  if (gaps.length > 0) {
    parts.push(`Gaps / Missing points:\n${gaps.map(g => `- ${g}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build a full AnonymousSynthesis from multiple AI responses.
 */
export function buildSynthesis(responses: string[]): AnonymousSynthesis {
  const consensus = findConsensus(responses);
  const disagreements = findDisagreements(responses);

  const sentences = responses.flatMap(extractKeySentences);
  const tokenSets = responses.map(r => new Set(tokenize(r)));
  const gaps: string[] = [];

  for (let i = 0; i < responses.length; i++) {
    const uniqueTokens = [...tokenSets[i]].filter(
      t => !tokenSets.some((set, j) => j !== i && set.has(t))
    );
    for (const token of uniqueTokens.slice(0, 2)) {
      const matching = sentences.find(s =>
        s.toLowerCase().includes(token)
      );
      if (matching && !gaps.includes(matching)) {
        gaps.push(matching);
      }
    }
  }

  return { consensus, disagreements, gaps: gaps.slice(0, 5) };
}
