import { useDiscussionStore } from '../store/discussionStore';

const ADAPTER_EMOJIS: Record<string, string> = {
  chatgpt: '🤖',
  gemini: '🔷',
};

export default function DiscussionLog() {
  const { discussion, selectedFilter, setFilter } = useDiscussionStore();
  if (!discussion) return null;

  const { rounds, config } = discussion;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700 text-sm">💬 讨论记录</span>
        <div className="flex gap-1">
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
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
            Round {round.roundNumber} — {round.type === 'independent' ? '独立回答' : round.type === 'critique_revise' ? '交叉审阅' : round.type === 'anonymous_synthesis' ? '匿名汇总' : '裁判总结'}
          </div>
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
              .filter(r => r.content)
              .map((response, j) => (
                <div key={j} className="text-sm">
                  <span className="font-medium">
                    {ADAPTER_EMOJIS[response.adapterId] ?? '🤖'} {response.adapterId}
                  </span>
                  <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{response.content}</p>
                  {response.confidence && (
                    <span className="text-xs text-gray-400">置信度: {response.confidence}/5</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
