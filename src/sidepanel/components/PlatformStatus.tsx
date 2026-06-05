import { useState, useEffect } from 'react';

const PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app' },
];

interface PlatformInfo {
  id: string;
  name: string;
  ready: boolean;
}

export default function PlatformStatus() {
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);

  useEffect(() => {
    checkPlatforms();
  }, []);

  const checkPlatforms = async () => {
    const tabs = await chrome.tabs.query({});
    const info: PlatformInfo[] = PLATFORMS.map(p => ({
      id: p.id,
      name: p.name,
      ready: tabs.some(t => t.url?.includes(p.id)),
    }));
    setPlatforms(info);
  };

  const openPlatform = async (url: string) => {
    await chrome.tabs.create({ url, active: false });
    setTimeout(checkPlatforms, 2000);
  };

  return (
    <div className="flex gap-2 text-sm">
      {platforms.map(p => (
        <div key={p.id} className="flex items-center gap-1">
          <span className={p.ready ? 'text-green-500' : 'text-yellow-500'}>
            {p.ready ? '●' : '○'}
          </span>
          <span className={p.ready ? 'text-gray-700' : 'text-gray-400'}>
            {p.name}
          </span>
          {!p.ready && (
            <button
              className="text-blue-500 hover:underline text-xs"
              onClick={() => openPlatform(PLATFORMS.find(x => x.id === p.id)!.url)}
            >
              打开
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
