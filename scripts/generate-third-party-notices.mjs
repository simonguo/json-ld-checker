import { readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const outputPath = path.join(root, 'THIRD_PARTY_NOTICES.txt');
const rootPackage = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8'),
);
const visited = new Set();
const packages = [];

async function findPackageDirectory(name, parentDirectory) {
  let current = parentDirectory;

  while (current.startsWith(root)) {
    const candidate = path.join(current, 'node_modules', name);
    try {
      return await realpath(candidate);
    } catch {
      const next = path.dirname(current);
      if (next === current) break;
      current = next;
    }
  }

  throw new Error(`Unable to resolve production dependency: ${name}`);
}

async function visit(name, parentDirectory) {
  const packageDirectory = await findPackageDirectory(name, parentDirectory);
  if (visited.has(packageDirectory)) return;
  visited.add(packageDirectory);

  const manifest = JSON.parse(
    await readFile(path.join(packageDirectory, 'package.json'), 'utf8'),
  );
  const files = await readdir(packageDirectory);
  const licenseFile = files.find((file) =>
    /^(licen[cs]e|copying)(?:\.|$)/i.test(file),
  );

  if (!licenseFile) {
    throw new Error(`No license file found for ${manifest.name}@${manifest.version}`);
  }

  packages.push({
    name: manifest.name,
    version: manifest.version,
    license: manifest.license || 'See included license text',
    text: (await readFile(path.join(packageDirectory, licenseFile), 'utf8')).trim(),
  });

  const childDependencies = {
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
  };

  for (const childName of Object.keys(childDependencies).sort()) {
    await visit(childName, packageDirectory);
  }
}

for (const dependency of Object.keys(rootPackage.dependencies || {}).sort()) {
  await visit(dependency, root);
}

packages.sort((left, right) =>
  `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`),
);

const divider = '\n\n--------------------------------------------------------------------------------\n\n';
const header = [
  'THIRD-PARTY SOFTWARE NOTICES AND INFORMATION',
  '',
  'JSON-LD Checker includes the following third-party software.',
  'The notices below are provided to satisfy their attribution requirements.',
].join('\n');
const entries = packages.map(
    (item) =>
      `${item.name}@${item.version}\nLicense: ${item.license}\n\n${item.text}`,
  );
const notice = `${header}${divider}${entries.join(divider)}\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== notice) {
    console.error(
      'THIRD_PARTY_NOTICES.txt is out of date. Run npm run licenses and commit the result.',
    );
    process.exitCode = 1;
  } else {
    console.log(`Third-party notices verified for ${packages.length} packages.`);
  }
} else {
  await writeFile(outputPath, notice);
  console.log(`Wrote notices for ${packages.length} packages.`);
}
