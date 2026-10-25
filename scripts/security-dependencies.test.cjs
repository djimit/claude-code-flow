const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { once } = require('node:events');
const test = require('node:test');
const { gzipSync } = require('node:zlib');
const fs = require('node:fs');
const semver = require('semver');

test('independent installation locks retain patched HTTP dependency versions', () => {
  const locks = ['package-lock.json', 'v3/pnpm-lock.yaml', 'v3/@claude-flow/mcp/pnpm-lock.yaml',
    'archive/v2/package-lock.json', 'archive/v2/pnpm-lock.yaml',
    'ruflo/src/ruvocal/package-lock.json', 'ruflo/src/ruvocal/mcp-bridge/package-lock.json'];
  for (const lock of locks) {
    const source = fs.readFileSync(lock, 'utf8');
    const versions = lock.endsWith('.json')
      ? Object.entries(JSON.parse(source).packages).filter(([path]) => /(?:^|\/)node_modules\/(body-parser|undici)$/.test(path))
        .map(([path, pkg]) => [path.split('/').at(-1), pkg.version])
      : [...source.matchAll(/^\s{2}['"]?\/?(body-parser|undici)@(\d+\.\d+\.\d+)[^:\n]*:/gm)].map(match => [match[1], match[2]]);
    assert.ok(versions.length, `${lock}: no HTTP dependency versions inspected`);
    for (const [name, version] of versions) {
      const major = semver.major(version);
      const floor = name === 'body-parser' ? (major === 1 ? '1.20.9' : '2.4.0')
        : ({ 6: '6.29.1', 7: '7.30.1', 8: '8.12.2' })[major];
      if (floor) assert.ok(semver.gte(version, floor), `${lock}: ${name}@${version} is below ${floor}`);
    }
  }
});

test('FastMCP rejects oversized collections before visiting their elements', () => {
  const { z } = require(require.resolve('zod', { paths: [require.resolve('fastmcp')] }));
  const schema = z.array(z.string()).max(1);
  assert.deepEqual(schema.parse(['valid']), ['valid']);
  const input = Array(10000).fill(null);
  Object.defineProperty(input, 0, { get() { throw new Error('oversized array element visited'); } });
  const result = schema.safeParse(input);
  assert.equal(result.success, false);
  assert.equal(result.error.issues.length, 1);
  assert.equal(result.error.issues[0].code, 'too_big');
});

test('TOML parsing preserves ordinary configs and bounds adversarial compiler work', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(require('toml').parse('model = "test"\nport = 42\n[[servers]]\nhost = "localhost"'))), {
    model: 'test', port: 42, servers: [{ host: 'localhost' }],
  });
  execFileSync(process.execPath, ['-e', `
    const { parse } = require('toml');
    parse(Array.from({ length: 20000 }, (_, i) => '[[a' + i + ']]\\nv = 1\\n').join(''));
    require('node:assert/strict').throws(() => parse('key = ' + '1'.repeat(100000)));
  `], { cwd: process.cwd(), timeout: 3000, stdio: 'pipe' });
});

test('supported body-parser majors preserve compressed JSON requests', async () => {
  for (const parser of [require.resolve('body-parser'), require.resolve('body-parser', { paths: [require.resolve('@claude-flow/mcp')] })]) {
    const express = require('express');
    const app = express();
    app.use(require(parser).json());
    app.post('/', (req, res) => res.json(req.body));
    app.use((error, req, res, next) => res.sendStatus(error.status || 500));
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const url = `http://127.0.0.1:${server.address().port}/`;
      const headers = { 'content-type': 'application/json', 'content-encoding': 'gzip' };
      const valid = gzipSync('{"ok":true}');
      const control = await fetch(url, { method: 'POST', headers, body: valid });
      assert.equal(control.status, 200);
      assert.deepEqual(await control.json(), { ok: true });
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }
});
