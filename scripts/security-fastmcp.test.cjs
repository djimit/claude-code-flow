const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const test = require('node:test');

test('FastMCP rejects oversized collections before visiting their elements', () => {
  // The browser workspace requires agentic-flow. Root agentic-flow is optional
  // and can be omitted by npm, so exercise the required consumer graph instead.
  const browserRequire = createRequire(path.resolve(__dirname, '../v3/@claude-flow/browser/package.json'));
  const agenticRequire = createRequire(browserRequire.resolve('agentic-flow'));
  const fastmcpRequire = createRequire(agenticRequire.resolve('fastmcp'));
  const { z } = fastmcpRequire('zod');
  const schema = z.array(z.string()).max(1);
  assert.deepEqual(schema.parse(['valid']), ['valid']);
  const input = Array(10000).fill(null);
  Object.defineProperty(input, 0, { get() { throw new Error('oversized array element visited'); } });
  const result = schema.safeParse(input);
  assert.equal(result.success, false);
  assert.equal(result.error.issues.length, 1);
  assert.equal(result.error.issues[0].code, 'too_big');
});
