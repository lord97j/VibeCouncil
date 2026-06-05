import type { AIResponse, AnonymousSynthesis } from '@/types';
import { buildSynthesis, formatSynthesis } from '@/utils/text';

interface AnonymizedResult {
  texts: string[];
  synthesis: AnonymousSynthesis;
}

/**
 * Strip adapter identifiers and produce anonymous summary.
 */
export function anonymizeResponses(responses: AIResponse[]): AnonymizedResult {
  const texts = responses
    .filter(r => r.status === 'completed' && r.content)
    .map(r => r.content);

  const synthesis = buildSynthesis(texts);

  return { texts, synthesis };
}

/**
 * Build an anonymous review prompt for the critique round.
 * Labels each response as "Expert N" to hide the source.
 */
export function buildAnonymousPrompt(
  responses: AIResponse[],
  originalQuestion: string,
): string {
  const { texts, synthesis } = anonymizeResponses(responses);
  const synthesisText = formatSynthesis(
    synthesis.consensus,
    synthesis.disagreements,
    synthesis.gaps,
  );

  const expertResponses = texts
    .map((text, i) => `Expert ${i + 1}:\n${text}`)
    .join('\n\n');

  return `Original question: ${originalQuestion}

Here is an anonymous summary of expert opinions:

${synthesisText}

Individual expert responses:

${expertResponses}

Please review the above opinions. You must:
1. Identify specific points you disagree with and explain why
2. Note any gaps or risks the other experts missed
3. State whether you change your original position and why

Do NOT simply agree with the majority. Provide your critical assessment.`;
}

/**
 * Build the judge prompt for the final synthesis round.
 */
export function buildJudgePrompt(
  question: string,
  rounds: { roundNumber: number; type: string; responses: AIResponse[]; synthesis?: AnonymousSynthesis }[],
): string {
  const parts = [`Original question: ${question}`];

  for (const round of rounds) {
    const completedResponses = round.responses.filter(
      r => r.status === 'completed' && r.content
    );

    if (round.type === 'independent') {
      parts.push(`\n--- Round ${round.roundNumber}: Independent Answers ---`);
      for (const r of completedResponses) {
        parts.push(`\n[${r.adapterId}]: ${r.content}`);
      }
    } else if (round.type === 'anonymous_synthesis' && round.synthesis) {
      parts.push(`\n--- Round ${round.roundNumber}: Anonymous Summary ---`);
      parts.push(formatSynthesis(
        round.synthesis.consensus,
        round.synthesis.disagreements,
        round.synthesis.gaps,
      ));
    } else if (round.type === 'critique_revise') {
      parts.push(`\n--- Round ${round.roundNumber}: Critique & Revision ---`);
      for (const r of completedResponses) {
        parts.push(`\n[${r.adapterId}]: ${r.content}`);
      }
    }
  }

  parts.push(`
--- Final Judge Instruction ---
You are the designated judge. Based on the entire discussion above, provide:
1. A structured summary of all viewpoints
2. Areas of consensus and disagreement
3. Your final recommended answer with reasoning
4. Any caveats or conditions for your recommendation`);

  return parts.join('\n');
}
