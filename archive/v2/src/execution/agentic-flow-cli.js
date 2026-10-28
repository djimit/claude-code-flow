import { execFile } from 'child_process';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

// Both archived entry points must execute the installed CLI without a shell.
const execFileAsync = promisify(execFile);
const packagePath = createRequire(import.meta.url).resolve('agentic-flow/package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const cliPath = path.resolve(path.dirname(packagePath), packageJson.bin['agentic-flow']);

/** @param {Array<string | number>} args @param {import('child_process').ExecFileOptions} [options] */
export function runAgenticFlow(args, options = {}) {
  return execFileAsync(process.execPath, [cliPath, ...args.map(String)], { ...options, encoding: 'utf8', shell: false });
}
