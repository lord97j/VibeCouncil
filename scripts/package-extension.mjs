import { access, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const distDir = join(root, 'dist');
const packagePath = join(root, 'VibeCouncil-v0.1.0.zip');

async function run(command, args, options = {}) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      stdio: 'inherit',
    });

    child.on('exit', code => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
    child.on('error', reject);
  });
}

await access(join(distDir, 'manifest.json'));
await rm(packagePath, { force: true });
await run('zip', ['-r', packagePath, '.'], { cwd: distDir });

console.log(`Created ${packagePath}`);
