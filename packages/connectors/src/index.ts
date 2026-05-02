import type { z } from "zod";

// A connector is a hardcoded API integration the workflow engine can call.
// Each connector declares its input schema, output shape, and timeout.
// v1 demo connectors (mock-labs, mock-radiology, mock-ehr-notes) live as
// siblings to this file and register themselves in the map below.

export interface ConnectorDefinition<TIn = unknown, TOut = unknown> {
  name: string;
  description: string;
  category: string;
  inputSchema: z.ZodType<TIn>;
  timeoutMs?: number;
  run: (input: TIn) => Promise<TOut>;
}

export const DEFAULT_CONNECTOR_TIMEOUT_MS = 50_000;

const connectors: Record<string, ConnectorDefinition> = {};

export function registerConnector(def: ConnectorDefinition): void {
  connectors[def.name] = def;
}

export function getConnector(name: string): ConnectorDefinition | undefined {
  return connectors[name];
}

export function listConnectors(): ConnectorDefinition[] {
  return Object.values(connectors);
}
