import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const manifest = JSON.parse(
  await readFile(new URL('../manifest.json', import.meta.url), 'utf8'),
);

if (packageJson.version !== manifest.version) {
  console.error(
    `Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`,
  );
  process.exitCode = 1;
} else {
  console.log(`Version check passed: ${manifest.version}`);
}
