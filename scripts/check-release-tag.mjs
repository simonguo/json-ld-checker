import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const tag = process.env.GITHUB_REF_NAME;
const expected = `v${packageJson.version}`;

if (!tag) {
  console.error('GITHUB_REF_NAME is not set.');
  process.exitCode = 1;
} else if (tag !== expected) {
  console.error(`Release tag mismatch: expected ${expected}, received ${tag}.`);
  process.exitCode = 1;
} else {
  console.log(`Release tag check passed: ${tag}`);
}
