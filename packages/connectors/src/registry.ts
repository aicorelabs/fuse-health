import type { BaseIntegration } from "./integration.js";
import type { IntegrationFunction } from "./function.js";

const integrations = new Map<string, BaseIntegration>();

export function registerIntegration(integration: BaseIntegration): void {
  integrations.set(integration.name, integration);
}

export function getIntegration(name: string): BaseIntegration | undefined {
  return integrations.get(name);
}

export function listIntegrations(): BaseIntegration[] {
  return [...integrations.values()];
}

export function resolveFunction(
  integrationName: string,
  functionName: string,
): IntegrationFunction<any, any> | undefined {
  return integrations.get(integrationName)?.getFunction(functionName);
}
