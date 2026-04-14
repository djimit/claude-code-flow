import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const binaryPath = path.join(projectRoot, 'bin', 'claude-flow');

const shouldSkip = process.env.SKIP_BINARY_BUILD === '1' || process.env.SKIP_BINARY_BUILD === 'true';

if (shouldSkip) {
  console.log('Skipping pkg binary build because SKIP_BINARY_BUILD is set.');
  process.exit(0);
}

const pkgExecutable = path.join(projectRoot, 'node_modules', '.bin', 'pkg');
const pkgArgs = [
  path.join(projectRoot, 'dist', 'src', 'cli', 'main.js'),
  '--targets',
  'node18-linux-x64,node18-macos-x64,node18-win-x64',
  '--output',
  binaryPath,
];

const pkgProcess = spawn(pkgExecutable, pkgArgs, { stdio: 'inherit' });

pkgProcess.on('exit', (code) => {
  if (code === 0) {
    process.exit(0);
  }

  const fallbackExists = fs.existsSync(binaryPath);
  console.warn('pkg build failed;');
  if (fallbackExists) {
    console.warn('Using existing binary at bin/claude-flow to keep the build pipeline moving.');
    process.exit(0);
  }

  console.error('No existing binary available and pkg failed.');
  process.exit(code ?? 1);
});
