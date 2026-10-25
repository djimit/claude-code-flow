/**
 * V3 Configuration Schemas
 * Zod schemas for all configuration types
 */

import { z } from 'zod';

/**
 * Agent configuration schema
 */
export const AgentConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  capabilities: z.array(z.string()).prefault([]),
  maxConcurrentTasks: z.number().int().min(1).prefault(5),
  priority: z.number().int().min(0).max(100).prefault(50),
  timeout: z.number().int().positive().optional(),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).prefault(3),
    backoffMs: z.number().int().positive().prefault(1000),
    backoffMultiplier: z.number().positive().prefault(2),
  }).optional(),
  resources: z.object({
    maxMemoryMb: z.number().int().positive().optional(),
    maxCpuPercent: z.number().min(0).max(100).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Task configuration schema
 */
export const TaskConfigSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  priority: z.number().int().min(0).max(100).prefault(50),
  timeout: z.number().int().positive().optional(),
  assignedAgent: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  metadata: z.object({
    requiredCapabilities: z.array(z.string()).optional(),
    retryCount: z.number().int().min(0).optional(),
    maxRetries: z.number().int().min(0).optional(),
    critical: z.boolean().optional(),
    parentTaskId: z.string().optional(),
    childTaskIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Swarm configuration schema
 */
export const SwarmConfigSchema = z.object({
  topology: z.enum(['hierarchical', 'mesh', 'ring', 'star', 'adaptive', 'hierarchical-mesh']),
  maxAgents: z.number().int().positive().prefault(20),
  autoScale: z.object({
    enabled: z.boolean().prefault(false),
    minAgents: z.number().int().min(0).prefault(1),
    maxAgents: z.number().int().positive().prefault(20),
    scaleUpThreshold: z.number().min(0).max(1).prefault(0.8),
    scaleDownThreshold: z.number().min(0).max(1).prefault(0.3),
  }).optional(),
  coordination: z.object({
    consensusRequired: z.boolean().prefault(false),
    timeoutMs: z.number().int().positive().prefault(10000),
    retryPolicy: z.object({
      maxRetries: z.number().int().min(0).prefault(3),
      backoffMs: z.number().int().positive().prefault(500),
    }),
  }).optional(),
  communication: z.object({
    protocol: z.enum(['events', 'messages', 'shared-memory']).prefault('events'),
    batchSize: z.number().int().positive().prefault(10),
    flushIntervalMs: z.number().int().positive().prefault(100),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Memory configuration schema
 */
export const MemoryConfigSchema = z.object({
  type: z.enum(['sqlite', 'agentdb', 'hybrid', 'redis', 'memory']).prefault('hybrid'),
  path: z.string().optional(),
  maxSize: z.number().int().positive().optional(),
  ttlMs: z.number().int().positive().optional(),
  sqlite: z.object({
    filename: z.string().optional(),
    inMemory: z.boolean().prefault(false),
    wal: z.boolean().prefault(true),
  }).optional(),
  agentdb: z.object({
    dimensions: z.number().int().positive().prefault(1536),
    indexType: z.enum(['hnsw', 'flat', 'ivf']).prefault('hnsw'),
    efConstruction: z.number().int().positive().prefault(200),
    m: z.number().int().positive().prefault(16),
    quantization: z.enum(['none', 'scalar', 'product']).prefault('none'),
  }).optional(),
  redis: z.object({
    host: z.string().prefault('localhost'),
    port: z.number().int().positive().prefault(6379),
    password: z.string().optional(),
    db: z.number().int().min(0).prefault(0),
    keyPrefix: z.string().prefault('claude-flow:'),
  }).optional(),
  hybrid: z.object({
    vectorThreshold: z.number().int().positive().prefault(100),
  }).optional(),
});

/**
 * MCP server configuration schema
 */
export const MCPServerConfigSchema = z.object({
  name: z.string().min(1).prefault('claude-flow'),
  version: z.string().min(1).prefault('3.0.0'),
  transport: z.object({
    type: z.enum(['stdio', 'http', 'websocket']).prefault('stdio'),
    port: z.number().int().positive().optional(),
    host: z.string().optional(),
    path: z.string().optional(),
  }),
  capabilities: z.object({
    tools: z.boolean().prefault(true),
    resources: z.boolean().prefault(true),
    prompts: z.boolean().prefault(true),
    logging: z.boolean().prefault(true),
    experimental: z.record(z.string(), z.boolean()).optional(),
  }).optional(),
});

/**
 * Orchestrator configuration schema
 */
export const OrchestratorConfigSchema = z.object({
  session: z.object({
    persistSessions: z.boolean().prefault(true),
    dataDir: z.string().prefault('./data'),
    sessionRetentionMs: z.number().int().positive().prefault(3600000),
  }),
  health: z.object({
    checkInterval: z.number().int().positive().prefault(30000),
    historyLimit: z.number().int().positive().prefault(100),
    degradedThreshold: z.number().int().min(0).prefault(1),
    unhealthyThreshold: z.number().int().min(0).prefault(2),
  }),
  lifecycle: z.object({
    maxConcurrentAgents: z.number().int().positive().prefault(20),
    spawnTimeout: z.number().int().positive().prefault(30000),
    terminateTimeout: z.number().int().positive().prefault(10000),
    maxSpawnRetries: z.number().int().min(0).prefault(3),
  }),
});

/**
 * Full system configuration schema
 * Uses passthrough() to accept unknown extra keys from user configs
 * without failing validation (e.g., simple key-value pairs, custom fields).
 */
export const SystemConfigSchema = z.object({
  orchestrator: OrchestratorConfigSchema,
  memory: MemoryConfigSchema.optional(),
  mcp: MCPServerConfigSchema.optional(),
  swarm: SwarmConfigSchema.optional(),
}).passthrough();

/**
 * Export schema types
 * Using z.output to get post-default types (fields with defaults are required in output)
 */
export type AgentConfig = z.output<typeof AgentConfigSchema>;
export type TaskConfig = z.output<typeof TaskConfigSchema>;
export type SwarmConfig = z.output<typeof SwarmConfigSchema>;
export type MemoryConfig = z.output<typeof MemoryConfigSchema>;
export type MCPServerConfig = z.output<typeof MCPServerConfigSchema>;
export type OrchestratorConfig = z.output<typeof OrchestratorConfigSchema>;
export type SystemConfig = z.output<typeof SystemConfigSchema>;

/**
 * Input types (for validation before defaults are applied)
 */
export type AgentConfigInput = z.input<typeof AgentConfigSchema>;
export type TaskConfigInput = z.input<typeof TaskConfigSchema>;
export type SwarmConfigInput = z.input<typeof SwarmConfigSchema>;
export type MemoryConfigInput = z.input<typeof MemoryConfigSchema>;
export type MCPServerConfigInput = z.input<typeof MCPServerConfigSchema>;
export type OrchestratorConfigInput = z.input<typeof OrchestratorConfigSchema>;
export type SystemConfigInput = z.input<typeof SystemConfigSchema>;
