// MCP server registry. Implementations (Epic, PubMed, etc.) live as siblings
// to this index and register themselves in the map below.

export interface McpServerDefinition {
  kind: string;
  name: string;
  description: string;
}

export const mcpServers: Record<string, McpServerDefinition> = {};

export function registerMcpServer(def: McpServerDefinition): void {
  mcpServers[def.kind] = def;
}
