import type { AIPlatformAdapter } from '@/types';

export class AdapterRegistry {
  private adapters = new Map<string, AIPlatformAdapter>();

  register(adapter: AIPlatformAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): AIPlatformAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): AIPlatformAdapter[] {
    return [...this.adapters.values()];
  }

  findByHost(url: string): AIPlatformAdapter | undefined {
    const hostname = new URL(url).hostname;
    return [...this.adapters.values()].find(a => hostname.includes(a.id));
  }

  clear(): void {
    this.adapters.clear();
  }
}

/** Global singleton registry */
export const adapterRegistry = new AdapterRegistry();
