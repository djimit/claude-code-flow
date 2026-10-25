const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { promisify } = require('node:util');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

test('agent execution passes task text and CLI options as literal arguments', async () => {
  const calls = [];
  let failure;
  function execFile() { throw new Error('Expected promisified execution'); }
  execFile[promisify.custom] = async (file, args, options = {}) => {
    calls.push({ file, args, options });
    if (failure) throw failure;
    return { stdout: args.includes('info') ? '{"name":"reviewer"}' : 'coder\nreviewer\n', stderr: '' };
  };
  const sourcePath = path.resolve('src/execution/agent-executor.ts');
  const source = fs.readFileSync(sourcePath, 'utf8').replaceAll('import.meta.url', JSON.stringify(pathToFileURL(sourcePath).href));
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } });
  const mod = { exports: {} };
  vm.runInNewContext(outputText, {
    module: mod, exports: mod.exports, process,
    require: name => name === 'child_process' ? { execFile } : require(name),
    console: { log() {}, warn() {}, error() {} },
  });
  const executor = new mod.exports.AgentExecutor();
  const task = 'Write "hello world" in Dutch';
  const result = await executor.execute({ agent: 'coder', task, model: 'example model', temperature: 0, maxTokens: 10 });
  assert.equal(result.success, true);
  assert.equal(calls[0].file, process.execPath);
  assert.ok(calls[0].args[0].endsWith('cli-proxy.js'));
  assert.deepEqual(Array.from(calls[0].args.slice(1)), ['--agent', 'coder', '--task', task, '--model', 'example model', '--temperature', '0', '--max-tokens', '10']);
  assert.notEqual(calls[0].options.shell, true);
  assert.deepEqual(Array.from(await executor.listAgents('local')), ['coder', 'reviewer']);
  assert.equal((await executor.getAgentInfo('reviewer')).name, 'reviewer');
  await executor.initializeMemory();
  assert.equal((await executor.getMemoryStats()).enabled, true);
  await executor.consolidateMemories();
  failure = new Error('process unavailable');
  const failed = await executor.execute({ agent: 'coder', task: 'ordinary task' });
  assert.equal(failed.success, false);
  assert.equal(failed.error, 'process unavailable');
  for (const call of calls) assert.notEqual(call.options.shell, true);
});

test('upgraded agentic-flow preserves the ReasoningBank adapter export contract', async () => {
  const backend = await import('agentic-flow/reasoningbank');
  for (const name of ['initialize', 'retrieveMemories', 'computeEmbedding', 'clearEmbeddingCache']) {
    assert.equal(typeof backend[name], 'function', name);
  }
  for (const name of ['upsertMemory', 'upsertEmbedding', 'fetchMemoryCandidates', 'getAllActiveMemories', 'getDb', 'runMigrations', 'closeDb']) {
    assert.equal(typeof backend.db[name], 'function', `db.${name}`);
  }
});
