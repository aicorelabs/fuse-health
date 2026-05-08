import {
  IntegrationFunction,
  type IntegrationFunctionJSON,
} from "./function.js";

export interface BaseIntegrationOptions {
  name: string;
  description: string;
  category: string;
  /** Optional human-friendly display label. Defaults to name. */
  label?: string;
  functions: IntegrationFunction<any, any>[];
}

export interface BaseIntegrationJSON {
  name: string;
  label: string;
  description: string;
  category: string;
  functions: IntegrationFunctionJSON[];
}

export abstract class BaseIntegration {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly category: string;
  private readonly functions: Map<string, IntegrationFunction<any, any>>;

  protected constructor(opts: BaseIntegrationOptions) {
    this.name = opts.name;
    this.label = opts.label ?? opts.name;
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

  toJSON(): BaseIntegrationJSON {
    return {
      name: this.name,
      label: this.label,
      description: this.description,
      category: this.category,
      functions: this.listFunctions().map((f) => f.toJSON()),
    };
  }
}
