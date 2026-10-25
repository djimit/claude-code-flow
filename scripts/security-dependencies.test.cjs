const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { once } = require('node:events');
const test = require('node:test');
const { gzipSync } = require('node:zlib');

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

test('compressed request errors do not escape either supported body-parser major', async () => {
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
      const malicious = await fetch(url, { method: 'POST', headers, body: Buffer.concat([valid, Buffer.from('trailing')]) });
      assert.equal(malicious.status, 400);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }
});
