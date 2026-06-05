import { useEffect } from 'react';
import { registerBuiltinStrategies } from '@/strategies';
import { useDiscussionStore } from './store/discussionStore';
import QuestionInput from './components/QuestionInput';
import PlatformStatus from './components/PlatformStatus';
import ProgressTimeline from './components/ProgressTimeline';
import DiscussionLog from './components/DiscussionLog';
import FinalConclusion from './components/FinalConclusion';
import Settings from './components/Settings';

export default function App() {
  const { discussion, showSettings, toggleSettings, isRunning, loadHistory } = useDiscussionStore();

  useEffect(() => {
    registerBuiltinStrategies();
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-bold text-gray-800">VibeCouncil</h1>
        <button
          className="text-gray-400 hover:text-gray-600 text-xl"
          onClick={toggleSettings}
        >
          ⚙️
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <PlatformStatus />
        <QuestionInput />
        {isRunning && <ProgressTimeline />}
        {discussion && <DiscussionLog />}
      </div>

      {/* Final conclusion (fixed bottom) */}
      {discussion?.finalConclusion && <FinalConclusion />}

      {/* Settings modal */}
      {showSettings && <Settings />}
    </div>
  );
}
