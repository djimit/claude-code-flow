/**
 * RuVector WASM Types
 */

import { z } from 'zod';

/**
 * WASM module status
 */
export type WasmModuleStatus = 'unloaded' | 'loading' | 'ready' | 'error';

/**
 * Base WASM bridge interface
 */
export interface WasmBridge<T = unknown> {
  readonly name: string;
  readonly version: string;
  readonly status: WasmModuleStatus;

  init(): Promise<void>;
  destroy(): Promise<void>;
  isReady(): boolean;
  getModule(): T | null;
}

/**
 * HNSW configuration
 */
export const HnswConfigSchema = z.object({
  dimensions: z.number().min(1).max(4096).prefault(384),
  maxElements: z.number().min(100).max(10_000_000).prefault(100_000),
  efConstruction: z.number().min(10).max(500).prefault(200),
  M: z.number().min(4).max(64).prefault(16),
  efSearch: z.number().min(10).max(500).prefault(100),
});

export type HnswConfig = z.infer<typeof HnswConfigSchema>;

/**
 * Vector search result
 */
export interface SearchResult {
  id: string;
  score: number;
  vector?: Float32Array;
  metadata?: Record<string, unknown>;
}

/**
 * Flash attention configuration
 */
export const AttentionConfigSchema = z.object({
  headDim: z.number().min(16).max(256).prefault(64),
  numHeads: z.number().min(1).max(128).prefault(8),
  seqLength: z.number().min(1).max(32768).prefault(512),
  causal: z.boolean().prefault(true),
  dropout: z.number().min(0).max(1).prefault(0),
});

export type AttentionConfig = z.infer<typeof AttentionConfigSchema>;

/**
 * GNN configuration
 */
export const GnnConfigSchema = z.object({
  inputDim: z.number().min(1).max(4096).prefault(384),
  hiddenDim: z.number().min(16).max(2048).prefault(256),
  outputDim: z.number().min(1).max(4096).prefault(128),
  numLayers: z.number().min(1).max(10).prefault(3),
  aggregation: z.enum(['mean', 'sum', 'max', 'attention']).prefault('mean'),
});

export type GnnConfig = z.infer<typeof GnnConfigSchema>;

/**
 * Hyperbolic embedding configuration
 */
export const HyperbolicConfigSchema = z.object({
  dimensions: z.number().min(2).max(1024).prefault(64),
  curvature: z.number().min(-10).max(-0.01).prefault(-1),
  model: z.enum(['poincare', 'lorentz', 'klein']).prefault('poincare'),
});

export type HyperbolicConfig = z.infer<typeof HyperbolicConfigSchema>;

/**
 * Reinforcement learning configuration
 */
export const LearningConfigSchema = z.object({
  algorithm: z.enum([
    'q-learning',
    'sarsa',
    'actor-critic',
    'ppo',
    'dqn',
    'decision-transformer',
  ]).prefault('ppo'),
  learningRate: z.number().min(0.00001).max(1).prefault(0.001),
  gamma: z.number().min(0).max(1).prefault(0.99),
  batchSize: z.number().min(1).max(1024).prefault(64),
});

export type LearningConfig = z.infer<typeof LearningConfigSchema>;

/**
 * Quantum-inspired optimization configuration
 */
export const ExoticConfigSchema = z.object({
  algorithm: z.enum([
    'qaoa',
    'vqe',
    'grover',
    'quantum-annealing',
    'tensor-network',
  ]).prefault('qaoa'),
  numQubits: z.number().min(2).max(64).prefault(16),
  depth: z.number().min(1).max(100).prefault(4),
  shots: z.number().min(100).max(100000).prefault(1000),
});

export type ExoticConfig = z.infer<typeof ExoticConfigSchema>;

/**
 * Cognitive kernel configuration
 */
export const CognitiveConfigSchema = z.object({
  workingMemorySize: z.number().min(3).max(15).prefault(7),
  attentionSpan: z.number().min(1).max(100).prefault(10),
  metaCognitionEnabled: z.boolean().prefault(true),
  scaffoldingLevel: z.enum(['none', 'light', 'moderate', 'heavy']).prefault('light'),
});

export type CognitiveConfig = z.infer<typeof CognitiveConfigSchema>;

/**
 * SONA (Self-Optimizing Neural Architecture) configuration
 */
export const SonaConfigSchema = z.object({
  mode: z.enum(['real-time', 'balanced', 'research', 'edge', 'batch']).prefault('balanced'),
  loraRank: z.number().min(1).max(64).prefault(4),
  learningRate: z.number().min(0.00001).max(0.1).prefault(0.001),
  ewcLambda: z.number().min(0).max(10000).prefault(100),
  batchSize: z.number().min(1).max(256).prefault(32),
});

export type SonaConfig = z.infer<typeof SonaConfigSchema>;
