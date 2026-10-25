const assert = require('node:assert/strict');
const { Writable } = require('node:stream');
const test = require('node:test');
const parquet = require('parquetjs');

test('patched Thrift preserves Parquet metadata and row round trips', async () => {
  const chunks = [];
  const stream = new Writable({ write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } });
  stream.close = callback => stream.end(callback);
  const schema = new parquet.ParquetSchema({ title: { type: 'UTF8' }, enabled: { type: 'BOOLEAN' } });
  const writer = await parquet.ParquetWriter.openStream(schema, stream);
  const row = { title: 'ordinary document', enabled: true };
  await writer.appendRow(row);
  await writer.close();
  const bytes = Buffer.concat(chunks);
  const envelope = new parquet.ParquetEnvelopeReader(async (offset, length) => bytes.subarray(offset, offset + length), async () => {}, bytes.length);
  await envelope.readHeader();
  const reader = new parquet.ParquetReader(await envelope.readFooter(), envelope);
  try {
    const cursor = reader.getCursor();
    assert.deepEqual(await cursor.next(), row);
    assert.equal(await cursor.next(), null);
  } finally { await reader.close(); }
});
