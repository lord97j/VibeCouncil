import { strategyRegistry } from './registry';
import { ParallelStrategy } from './parallel';
import { DelphiStrategy } from './delphi';
import { DebateStrategy } from './debate';
import { SixHatsStrategy } from './six-hats';
import { RedBlueStrategy } from './red-blue';
import { MatrixStrategy } from './matrix';

/**
 * Register all built-in discussion strategies.
 */
export function registerBuiltinStrategies(): void {
  strategyRegistry.register(new ParallelStrategy());
  strategyRegistry.register(new DelphiStrategy());
  strategyRegistry.register(new DebateStrategy());
  strategyRegistry.register(new SixHatsStrategy());
  strategyRegistry.register(new RedBlueStrategy());
  strategyRegistry.register(new MatrixStrategy());
}

export { strategyRegistry };
