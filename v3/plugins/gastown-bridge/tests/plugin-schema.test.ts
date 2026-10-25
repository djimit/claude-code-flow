import { describe, expect, it } from 'vitest';
import { GasTownBridgePlugin } from '../src/index.js';

describe('MCP schema registration', () => {
  it('advertises required fields and numeric defaults from native Zod schemas', () => {
    const tool = new GasTownBridgePlugin().getMCPTools().find(tool => tool.name === 'gt_beads_create');
    expect(tool?.inputSchema.required).toContain('title');
    expect(tool?.inputSchema.properties.title).toEqual(expect.objectContaining({ type: 'string' }));
    expect(tool?.inputSchema.properties.priority).toEqual(expect.objectContaining({ type: 'integer', default: 2 }));
  });
});
