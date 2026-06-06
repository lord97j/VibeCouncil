export interface PlatformConfig {
  id: string;
  name: string;
  defaultUrl: string;
  host: string;
  region: 'global' | 'china';
}

export const AI_PLATFORMS: PlatformConfig[] = [
  { id: 'chatgpt', name: 'ChatGPT', defaultUrl: 'https://chatgpt.com', host: 'chatgpt.com', region: 'global' },
  { id: 'gemini', name: 'Gemini', defaultUrl: 'https://gemini.google.com/app', host: 'gemini.google.com', region: 'global' },
  { id: 'grok', name: 'Grok', defaultUrl: 'https://grok.com/?q=&reasoningMode=none&voice=false', host: 'grok.com', region: 'global' },
  { id: 'claude', name: 'Claude', defaultUrl: 'https://claude.ai/new', host: 'claude.ai', region: 'global' },
  { id: 'deepseek', name: 'DeepSeek', defaultUrl: 'https://chat.deepseek.com/', host: 'chat.deepseek.com', region: 'china' },
  { id: 'qianwen', name: '千问', defaultUrl: 'https://www.qianwen.com/', host: 'www.qianwen.com', region: 'china' },
];

export function getPlatform(id: string): PlatformConfig | undefined {
  return AI_PLATFORMS.find(platform => platform.id === id);
}

export function getPlatformLabel(id: string): string {
  return getPlatform(id)?.name ?? id;
}

export function urlMatchesPlatform(url: string | undefined, platform: PlatformConfig): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return hostname === platform.host || hostname.endsWith(`.${platform.host}`);
  } catch {
    return url.includes(platform.host);
  }
}
