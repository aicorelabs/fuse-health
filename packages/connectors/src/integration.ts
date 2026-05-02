import { IntegrationFunction } from "./function.js";

export interface BaseIntegrationOptions {
  name: string;
  description: string;
  category: string;
  functions: IntegrationFunction<any, any>[];
}

export abstract class BaseIntegration {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  private readonly functions: Map<string, IntegrationFunction<any, any>>;

  protected constructor(opts: BaseIntegrationOptions) {
    this.name = opts.name;
    this.description = opts.description;
    this.category = opts.category;
    this.functions = new Map(opts.functions.map((f) => [f.name, f]));
  }

  getFunction(name: string): IntegrationFunction<any, any> | undefined {
    return this.functions.get(name);
  }

  listFunctions(): IntegrationFunction<any, any>[] {
    return [...this.functions.values()];
  }
}
