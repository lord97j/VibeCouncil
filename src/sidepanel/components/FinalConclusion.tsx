import { useDiscussionStore } from '../store/discussionStore';

export default function FinalConclusion() {
  const { discussion, resetDiscussion } = useDiscussionStore();
  if (!discussion?.finalConclusion) return null;

  const { content } = discussion.finalConclusion;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleExport = () => {
    const md = formatToMarkdown(discussion);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-council-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t bg-green-50 p-4 space-y-2">
      <div className="font-medium text-green-800">🏆 最终结论</div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{content}</div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50"
          onClick={handleCopy}
        >
          📋 复制
        </button>
        <button
          className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50"
          onClick={handleExport}
        >
          💾 导出
        </button>
        <button
          className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50"
          onClick={resetDiscussion}
        >
          🔄 重试
        </button>
      </div>
    </div>
  );
}

function formatToMarkdown(discussion: NonNullable<ReturnType<typeof useDiscussionStore.getState>['discussion']>): string {
  const parts = [`# VibeCouncil Discussion\n\n**Question:** ${discussion.question}\n\n`];

  for (const round of discussion.rounds) {
    parts.push(`## Round ${round.roundNumber} (${round.type})\n\n`);
    for (const r of round.responses) {
      if (r.content) {
        parts.push(`### ${r.adapterId}\n\n${r.content}\n\n`);
      }
    }
  }

  if (discussion.finalConclusion) {
    parts.push(`## Final Conclusion (by ${discussion.finalConclusion.judgeAdapterId})\n\n${discussion.finalConclusion.content}\n`);
  }

  return parts.join('');
}
