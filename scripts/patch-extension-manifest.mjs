import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.resolve('dist/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

manifest.web_accessible_resources = [
  {
    matches: ['https://chatgpt.com/*'],
    resources: ['assets/*'],
  },
  {
    matches: ['https://gemini.google.com/*'],
    resources: ['assets/*'],
  },
];

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Patched dist/manifest.json web_accessible_resources for content scripts');
