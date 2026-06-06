import { useState, useEffect } from 'react';
import { AI_PLATFORMS, urlMatchesPlatform } from '@/platforms';

interface PlatformInfo {
  id: string;
  name: string;
  defaultUrl: string;
  region: 'global' | 'china';
  ready: boolean;
}

const PLATFORM_GROUPS = [
  { id: 'global', label: '国外' },
  { id: 'china', label: '国内' },
] as const;

export default function PlatformStatus() {
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);

  useEffect(() => {
    checkPlatforms();
  }, []);

  const checkPlatforms = async () => {
    const tabs = await chrome.tabs.query({});
    const info: PlatformInfo[] = AI_PLATFORMS.map(p => ({
      id: p.id,
      name: p.name,
      defaultUrl: p.defaultUrl,
      region: p.region,
      ready: tabs.some(t => urlMatchesPlatform(t.url, p)),
    }));
    setPlatforms(info);
  };

  const openPlatform = async (url: string) => {
    await chrome.tabs.create({ url, active: false });
    setTimeout(checkPlatforms, 2000);
  };

  return (
    <div className="space-y-1 text-sm">
      {PLATFORM_GROUPS.map(group => {
        const groupPlatforms = platforms.filter(p => p.region === group.id);
        if (groupPlatforms.length === 0) return null;

        return (
          <div key={group.id} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-xs text-gray-400">{group.label}</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-x-2 gap-y-1">
              {groupPlatforms.map(p => (
                <div key={p.id} className="flex items-center gap-1 whitespace-nowrap">
                  <span className={p.ready ? 'text-green-500' : 'text-yellow-500'}>
                    {p.ready ? '●' : '○'}
                  </span>
                  <span className={p.ready ? 'text-gray-700' : 'text-gray-400'}>
                    {p.name}
                  </span>
                  {!p.ready && (
                    <button
                      className="text-blue-500 hover:underline text-xs"
                      onClick={() => openPlatform(p.defaultUrl)}
                    >
                      打开
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
