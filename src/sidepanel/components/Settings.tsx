import { useDiscussionStore } from '../store/discussionStore';

export default function Settings() {
  const { settings, updateSettings, toggleSettings } = useDiscussionStore();

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-end">
      <div className="w-full max-w-xs bg-white h-full p-4 space-y-4 overflow-auto shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">⚙️ 设置</h2>
          <button onClick={toggleSettings} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div>
          <label className="text-sm text-gray-600">默认讨论模式</label>
          <select
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.defaultStrategyId}
            onChange={e => updateSettings({ defaultStrategyId: e.target.value })}
          >
            <option value="parallel">快速对比</option>
            <option value="delphi">专家收敛</option>
            <option value="debate">圆桌讨论</option>
            <option value="six-hats">多视角分析</option>
            <option value="red-blue">攻防评审</option>
            <option value="matrix">选型打分</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">默认裁判 AI</label>
          <select
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.defaultJudgeAdapterId}
            onChange={e => updateSettings({ defaultJudgeAdapterId: e.target.value })}
          >
            <option value="chatgpt">ChatGPT</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">默认轮次</label>
          <input
            type="number"
            min={1}
            max={4}
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.defaultRounds}
            onChange={e => updateSettings({ defaultRounds: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">历史记录上限</label>
          <input
            type="number"
            min={10}
            max={200}
            className="w-full mt-1 p-2 border rounded-lg text-sm"
            value={settings.historyLimit}
            onChange={e => updateSettings({ historyLimit: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
