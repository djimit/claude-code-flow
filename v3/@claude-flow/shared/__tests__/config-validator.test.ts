import { describe, expect, it } from 'vitest';
import { ConfigValidator, validateAgentConfig, validateSwarmConfig } from '../src/core/config/validator.js';

describe('configuration validation after the native Zod migration', () => {
  it('preserves defaults and arbitrary metadata values', () => {
    const metadata = { enabled: true, retries: 3 };
    const result = validateAgentConfig({ id: 'agent', name: 'Agent', type: 'coder', metadata });
    expect(result.success).toBe(true);
    expect(result.data?.metadata).toEqual(metadata);
    expect(result.data?.capabilities).toEqual([]);
    expect(result.data?.maxConcurrentTasks).toBe(5);
    expect(result.data?.retryPolicy).toBeUndefined();
  });

  it('still applies nested defaults when a configuration object is provided', () => {
    const result = validateSwarmConfig({ topology: 'hierarchical', autoScale: {} });
    expect(result.success).toBe(true);
    expect(result.data?.autoScale).toEqual({ enabled: false, minAgents: 1, maxAgents: 20, scaleUpThreshold: 0.8, scaleDownThreshold: 0.3 });
  });

  it('preserves structured failures and the throwing helper contract', () => {
    const input = { id: 'agent', name: 'Agent', type: 'coder', maxConcurrentTasks: 0 };
    const result = validateAgentConfig(input);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual([expect.objectContaining({ path: 'maxConcurrentTasks', code: 'too_small', message: expect.any(String) })]);
    expect(() => ConfigValidator.validateAgentOrThrow(input)).toThrow('Invalid agent configuration:');
  });
});
