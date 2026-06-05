import { useState } from 'react';
import { useDiscussionStore } from '../store/discussionStore';

const ADAPTER_EMOJIS: Record<string, string> = {
  chatgpt: '🤖',
  gemini: '🔷',
};

export default function DiscussionLog() {
  const { discussion, selectedFilter, setFilter } = useDiscussionStore();
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  if (!discussion) return null;

  const { rounds, config } = discussion;
  const allCollapsed = rounds.length > 0 && rounds.every(round => collapsedRounds.has(round.roundNumber));

  const visibleRoundCount = rounds.filter(round =>
    round.responses.some(r => !selectedFilter || r.adapterId === selectedFilter)
  ).length;

  const toggleRound = (roundNumber: number) => {
    setCollapsedRounds(prev => {
      const next = new Set(prev);
      if (next.has(roundNumber)) next.delete(roundNumber);
      else next.add(roundNumber);
      return next;
    });
  };

  const toggleAllRounds = () => {
    setCollapsedRounds(allCollapsed ? new Set() : new Set(rounds.map(round => round.roundNumber)));
  };

  const toggleResponse = (key: string) => {
    setExpandedResponses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-700 text-sm">💬 讨论记录</span>
          <span className="ml-2 text-xs text-gray-400">{visibleRoundCount}/{rounds.length} 轮</span>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <button
            className="px-2 py-0.5 text-xs rounded text-gray-500 hover:bg-gray-100"
            onClick={toggleAllRounds}
          >
            {allCollapsed ? '展开' : '折叠'}
          </button>
          <button
            className={`px-2 py-0.5 text-xs rounded ${!selectedFilter ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setFilter(null)}
          >
            全部
          </button>
          {config.participantIds.map(id => (
            <button
              key={id}
              className={`px-2 py-0.5 text-xs rounded ${selectedFilter === id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setFilter(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {rounds.map((round, i) => (
        <div key={i} className="border rounded overflow-hidden">
          <button
            className="flex w-full items-center justify-between gap-2 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-100"
            onClick={() => toggleRound(round.roundNumber)}
          >
            <span>
              Round {round.roundNumber} — {round.type === 'independent' ? '独立回答' : round.type === 'critique_revise' ? '交叉审阅' : round.type === 'anonymous_synthesis' ? '匿名汇总' : '裁判总结'}
            </span>
            <span className="shrink-0 text-gray-400">
              {collapsedRounds.has(round.roundNumber) ? '展开' : '收起'}
            </span>
          </button>
          {!collapsedRounds.has(round.roundNumber) && (
            <div className="p-3 space-y-2">
              {round.synthesis && (
                <div className="text-sm bg-yellow-50 p-2 rounded">
                  <div className="font-medium text-yellow-800">📋 匿名汇总</div>
                  {round.synthesis.consensus.length > 0 && (
                    <div className="mt-1 text-yellow-700">共识: {round.synthesis.consensus.join('; ')}</div>
                  )}
                  {round.synthesis.disagreements.length > 0 && (
                    <div className="mt-1 text-red-600">分歧: {round.synthesis.disagreements.join('; ')}</div>
                  )}
                </div>
              )}
              {round.responses
                .filter(r => !selectedFilter || r.adapterId === selectedFilter)
                .map((response, j) => {
                  const key = `${round.roundNumber}-${response.adapterId}-${j}`;
                  const text = response.content || response.error || '';
                  const isLong = text.length > 520;
                  const expanded = expandedResponses.has(key);
                  const displayText = isLong && !expanded ? `${text.slice(0, 520)}...` : text;

                  return (
                    <div key={j} className="text-sm border-l-2 border-gray-100 pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {ADAPTER_EMOJIS[response.adapterId] ?? '🤖'} {response.adapterId}
                        </span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${response.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {response.status === 'failed' ? '失败' : response.status === 'completed' ? '完成' : response.status}
                        </span>
                      </div>
                      {text ? (
                        <>
                          <p className={`mt-1 whitespace-pre-wrap leading-6 ${response.status === 'failed' ? 'text-red-600' : 'text-gray-700'}`}>
                            {displayText}
                          </p>
                          {isLong && (
                            <button
                              className="mt-1 text-xs text-blue-600 hover:underline"
                              onClick={() => toggleResponse(key)}
                            >
                              {expanded ? '收起内容' : '展开全文'}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">等待响应...</p>
                      )}
                      {response.confidence && (
                        <span className="text-xs text-gray-400">置信度: {response.confidence}/5</span>
                      )}
                    </div>
                  );
                })}
              {round.responses.filter(r => !selectedFilter || r.adapterId === selectedFilter).length === 0 && (
                <div className="text-xs text-gray-400">当前筛选下没有记录</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
