import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';

const execFile = promisify(execFileCallback);
const projectRoot = resolve(import.meta.dirname, '..');
const powershell = process.platform === 'win32' ? 'powershell.exe' : null;

// Windows PowerShell 5.1 launched from a PowerShell 7 shell inherits PS7's
// PSModulePath and then cannot load its own built-in modules (#1392). Drop the
// variable so powershell.exe rebuilds its default, as it does from cmd.exe.
function runPowerShell(args) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name.toLowerCase() !== 'psmodulepath'),
  );
  return execFile(powershell, args, { env });
}

// The bootstrap scripts pick their package manager from whichever lockfile is
// committed: pnpm-lock.yaml (what this repo ships) or package-lock.json.
// Both paths are covered here, because a script that only knew about npm
// refused to run against this repo's own lockfile.
const LOCKFILES = {
  npm: {
    name: 'package-lock.json',
    contents: '{"name":"bootstrap-fixture","lockfileVersion":3}\n',
  },
  pnpm: {
    name: 'pnpm-lock.yaml',
    contents: [
      "lockfileVersion: '9.0'",
      '',
      'settings:',
      '  autoInstallPeers: true',
      '  excludeLinksFromLockfile: false',
      '',
      'importers:',
      '',
      '  .: {}',
      '',
      'packages: {}',
      '',
      'snapshots: {}',
      '',
    ].join('\n'),
  },
};

async function makeFixture(t, flavour = 'npm') {
  const fixture = await mkdtemp(join(tmpdir(), 'freegateway-bootstrap-'));
  const { name, contents } = LOCKFILES[flavour];
  const lockfile = join(fixture, name);
  const lockHash = createHash('sha256').update(contents).digest('hex');

  await writeFile(join(fixture, 'package.json'), '{"name":"bootstrap-fixture"}\n');
  await writeFile(lockfile, contents);
  await mkdir(join(fixture, 'node_modules'));
  await writeFile(join(fixture, 'node_modules', '.freegateway-bootstrap-lock'), lockHash);
  t.after(() => rm(fixture, { force: true, recursive: true }));
  return { fixture, lockfile };
}

async function assertEnvIsCreatedAndPreserved(runBootstrap, t, flavour = 'npm') {
  const { fixture } = await makeFixture(t, flavour);

  await runBootstrap(fixture);
  const generatedEnv = await readFile(join(fixture, '.env'), 'utf8');
  assert.match(generatedEnv, /^ENCRYPTION_KEY=[0-9a-f]{64}\r?\nPORT=3001\r?\n$/);

  const existingEnv = 'ENCRYPTION_KEY=keep-this-value\nPORT=4444\n';
  await writeFile(join(fixture, '.env'), existingEnv);
  await runBootstrap(fixture);
  assert.equal(await readFile(join(fixture, '.env'), 'utf8'), existingEnv);
}

async function assertMissingStampInstalls(runBootstrap, t, flavour = 'npm') {
  const { fixture, lockfile } = await makeFixture(t, flavour);
  await rm(join(fixture, 'node_modules', '.freegateway-bootstrap-lock'));

  await runBootstrap(fixture);

  const lockHash = createHash('sha256').update(await readFile(lockfile)).digest('hex');
  assert.equal(
    (await readFile(join(fixture, 'node_modules', '.freegateway-bootstrap-lock'), 'utf8')).trim(),
    lockHash,
  );
}

test('PowerShell bootstrap creates and preserves .env', { skip: powershell === null }, async (t) => {
  await assertEnvIsCreatedAndPreserved(
    (fixture) => runPowerShell([
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', join(projectRoot, 'scripts', 'dev-bootstrap.ps1'),
      '-ProjectRoot', fixture,
    ]),
    t,
  );
});

test('Bash bootstrap creates and preserves .env', { skip: process.platform === 'win32' }, async (t) => {
  await assertEnvIsCreatedAndPreserved(
    (fixture) => execFile('bash', [join(projectRoot, 'scripts', 'dev-bootstrap.sh'), '--project-root', fixture]),
    t,
  );
});

test('PowerShell bootstrap installs when the lockfile stamp is missing', { skip: powershell === null }, async (t) => {
  await assertMissingStampInstalls(
    (fixture) => runPowerShell([
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', join(projectRoot, 'scripts', 'dev-bootstrap.ps1'),
      '-ProjectRoot', fixture,
    ]),
    t,
  );
});

test('Bash bootstrap installs when the lockfile stamp is missing', { skip: process.platform === 'win32' }, async (t) => {
  await assertMissingStampInstalls(
    (fixture) => execFile('bash', [join(projectRoot, 'scripts', 'dev-bootstrap.sh'), '--project-root', fixture]),
    t,
  );
});

// The repo ships pnpm-lock.yaml, not package-lock.json. A bootstrap script
// that hard-requires the npm lockfile exits before doing anything, so the
// pnpm path needs its own coverage.
test('PowerShell bootstrap works with a pnpm lockfile', { skip: powershell === null }, async (t) => {
  await assertEnvIsCreatedAndPreserved(
    (fixture) => runPowerShell([
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', join(projectRoot, 'scripts', 'dev-bootstrap.ps1'),
      '-ProjectRoot', fixture,
    ]),
    t,
    'pnpm',
  );
});

test('Bash bootstrap works with a pnpm lockfile', { skip: process.platform === 'win32' }, async (t) => {
  await assertEnvIsCreatedAndPreserved(
    (fixture) => execFile('bash', [join(projectRoot, 'scripts', 'dev-bootstrap.sh'), '--project-root', fixture]),
    t,
    'pnpm',
  );
});

test('PowerShell bootstrap installs with a pnpm lockfile', { skip: powershell === null }, async (t) => {
  await assertMissingStampInstalls(
    (fixture) => runPowerShell([
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', join(projectRoot, 'scripts', 'dev-bootstrap.ps1'),
      '-ProjectRoot', fixture,
    ]),
    t,
    'pnpm',
  );
});
