import { useState } from 'react';
import { useDiscussionStore } from '../store/discussionStore';

const STRATEGIES = [
  { id: 'parallel', name: '快速对比' },
  { id: 'delphi', name: '专家收敛' },
  { id: 'debate', name: '圆桌讨论' },
  { id: 'six-hats', name: '多视角分析' },
  { id: 'red-blue', name: '攻防评审' },
  { id: 'matrix', name: '选型打分' },
];

const ADAPTERS = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'gemini', name: 'Gemini' },
];

const STYLES = [
  { id: 'strict', name: '严谨' },
  { id: 'neutral', name: '中立' },
  { id: 'creative', name: '创意' },
];

export default function QuestionInput() {
  const [question, setQuestion] = useState('');
  const [strategyId, setStrategyId] = useState('delphi');
  const [judgeId, setJudgeId] = useState('chatgpt');
  const [style, setStyle] = useState<string>('neutral');
  const [rounds, setRounds] = useState(3);

  const { startDiscussion, isRunning } = useDiscussionStore();

  const handleStart = async () => {
    if (!question.trim()) return;
    try {
      await startDiscussion(question.trim(), {
        rounds,
        strategyId,
        judgeAdapterId: judgeId,
        promptStyle: style as 'strict' | 'creative' | 'neutral',
        participantIds: ADAPTERS.map(a => a.id),
      });
    } catch (err) {
      console.error('[VibeCouncil] Failed to start:', err);
      alert(`启动失败: ${(err as Error).message}`);
    }
  };

  if (isRunning) {
    return (
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 rounded-lg">
        讨论进行中...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        rows={3}
        placeholder="输入你的问题..."
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <select
          className="p-2 border rounded-lg bg-white"
          value={strategyId}
          onChange={e => setStrategyId(e.target.value)}
        >
          {STRATEGIES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg bg-white"
          value={rounds}
          onChange={e => setRounds(Number(e.target.value))}
        >
          {[1, 2, 3, 4].map(n => (
            <option key={n} value={n}>{n} 轮</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg bg-white"
          value={judgeId}
          onChange={e => setJudgeId(e.target.value)}
        >
          {ADAPTERS.map(a => (
            <option key={a.id} value={a.id}>裁判: {a.name}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg bg-white"
          value={style}
          onChange={e => setStyle(e.target.value)}
        >
          {STYLES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <button
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        disabled={!question.trim()}
        onClick={handleStart}
      >
        🚀 开始讨论
      </button>
    </div>
  );
}
