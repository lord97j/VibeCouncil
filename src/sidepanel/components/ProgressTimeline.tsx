import { useDiscussionStore } from '../store/discussionStore';

const ROUND_LABELS: Record<string, string> = {
  independent: '独立回答',
  anonymous_synthesis: '匿名汇总',
  critique_revise: '交叉审阅',
  judge: '裁判总结',
};

export default function ProgressTimeline() {
  const { discussion } = useDiscussionStore();
  if (!discussion) return null;

  const { rounds, config } = discussion;
  const totalRounds = config.rounds;

  return (
    <div className="space-y-1 text-sm">
      <div className="font-medium text-gray-700">📊 讨论进度</div>
      {Array.from({ length: totalRounds }, (_, i) => {
        const round = rounds[i];
        const isActive = i === discussion.currentRoundIndex;
        const isDone = round && round.responses.every(r => r.status === 'completed' || r.status === 'failed');
        const icon = isDone ? '✅' : isActive ? '◐' : '○';
        const label = round?.type ? ROUND_LABELS[round.type] : `Round ${i + 1}`;

        return (
          <div key={i} className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
            <span>{icon}</span>
            <span>Round {i + 1}: {label}</span>
            {isActive && <span className="animate-pulse">⏳</span>}
          </div>
        );
      })}
    </div>
  );
}
