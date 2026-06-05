import { useEffect, useState } from 'react';
import { useDiscussionStore } from '../store/discussionStore';

export default function FinalConclusion() {
  const { discussion, resetDiscussion } = useDiscussionStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  if (!discussion?.finalConclusion) return null;

  const { content } = discussion.finalConclusion;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
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
    setShowExportConfirm(false);
  };

  if (isMinimized) {
    return (
      <div className="border-t bg-emerald-50 px-3 py-2 shadow-[0_-4px_16px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2">
          <button
            className="shrink-0 px-2 py-1 bg-white border rounded text-xs text-emerald-700 hover:bg-emerald-50"
            onClick={() => setIsMinimized(false)}
          >
            展开
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-emerald-800">最终结论</div>
            <div className="truncate text-xs text-emerald-900">{content}</div>
          </div>
          <button
            className="shrink-0 px-2 py-1 bg-white border rounded text-xs text-gray-600 hover:bg-gray-50"
            onClick={handleCopy}
          >
            复制
          </button>
        </div>
        {copyState !== 'idle' && (
          <div className={`mt-1 text-xs ${copyState === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
            {copyState === 'success' ? '已复制到剪贴板' : '复制失败，请手动选择文本'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t bg-emerald-50 p-4 space-y-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-emerald-800">🏆 最终结论</div>
          <div className="text-xs text-emerald-700">由 {discussion.finalConclusion.judgeAdapterId} 汇总</div>
        </div>
        <button
          className="px-2 py-1 bg-white border rounded text-xs text-gray-600 hover:bg-gray-50"
          onClick={() => setIsMinimized(true)}
        >
          收起
        </button>
      </div>

      <div className="max-h-48 overflow-auto rounded border border-emerald-100 bg-white/80 p-3 text-sm text-gray-800 whitespace-pre-wrap leading-6">
        {content}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="px-3 py-1.5 bg-white border rounded text-xs hover:bg-gray-50"
          onClick={handleCopy}
        >
          📋 复制
        </button>
        <button
          className="px-3 py-1.5 bg-white border rounded text-xs hover:bg-gray-50"
          onClick={() => setShowExportConfirm(true)}
        >
          💾 导出
        </button>
        <button
          className="px-3 py-1.5 bg-white border rounded text-xs hover:bg-gray-50"
          onClick={resetDiscussion}
        >
          🔄 重试
        </button>
        {copyState !== 'idle' && (
          <span className={`text-xs ${copyState === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
            {copyState === 'success' ? '已复制到剪贴板' : '复制失败，请手动选择文本'}
          </span>
        )}
      </div>

      {showExportConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30">
          <div className="w-full bg-white p-4 shadow-lg">
            <div className="font-medium text-gray-900">导出讨论记录？</div>
            <div className="mt-1 text-sm text-gray-600">
              将保存包含问题、各轮回答和最终结论的 Markdown 文件。
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => setShowExportConfirm(false)}
              >
                取消
              </button>
              <button
                className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                onClick={handleExport}
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
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
