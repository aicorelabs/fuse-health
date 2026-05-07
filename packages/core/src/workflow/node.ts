import { z } from "zod";

// Workflow node taxonomy. v1 surface is intentionally narrow but layered:
// every node kind has a class with typed config so the editor and engine
// share one source of truth.
//
// Wired in engine v1: trigger.* (passthrough), action, http, set, wait,
// stop, merge.
// Stubbed (NotImplementedNodeError): llm, branch, filter, loop.

export const NodeKindSchema = z.enum([
  "trigger.manual",
  "trigger.webhook",
  "trigger.schedule",
  "action",
  "http",
  "llm",
  "branch",
  "filter",
  "loop",
  "merge",
  "set",
  "wait",
  "stop",
]);
export type NodeKind = z.infer<typeof NodeKindSchema>;

const PositionSchema = z.object({ x: z.number(), y: z.number() }).optional();

const baseFields = {
  id: z.string(),
  name: z.string(),
  position: PositionSchema,
};

export interface Position {
  x: number;
  y: number;
}

// ──────── Schemas ────────

export const TriggerManualNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("trigger.manual"),
  config: z.object({}).passthrough().default({}),
});

export const TriggerWebhookNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("trigger.webhook"),
  config: z.object({
    path: z.string().min(1),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
    secret: z.string().optional(),
  }),
});

export const TriggerScheduleNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("trigger.schedule"),
  config: z.object({
    cron: z.string().min(1),
    timezone: z.string().optional(),
  }),
});

export const ActionNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("action"),
  config: z.object({
    integration: z.string(),
    function: z.string(),
    input: z.record(z.unknown()).default({}),
  }),
});

export const HttpNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("http"),
  config: z.object({
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
    url: z.string().min(1),
    headers: z.record(z.string()).optional(),
    query: z.record(z.string()).optional(),
    body: z.unknown().optional(),
    timeoutMs: z.number().int().positive().optional(),
  }),
});

export const LLMNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("llm"),
  config: z.object({
    prompt: z.string(),
    model: z.string().optional(),
  }),
});

export const ConditionOpSchema = z.enum([
  "==",
  "!=",
  "===",
  "!==",
  ">",
  "<",
  ">=",
  "<=",
  "in",
  "truthy",
  "falsy",
]);
export type ConditionOp = z.infer<typeof ConditionOpSchema>;

export const ConditionSchema = z.object({
  left: z.unknown(),
  op: ConditionOpSchema,
  right: z.unknown().optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const BranchNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("branch"),
  config: z.object({
    cases: z.array(
      z.object({
        when: ConditionSchema,
        edge: z.string().min(1),
      }),
    ),
    default: z.string().optional(),
  }),
});

export const FilterNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("filter"),
  config: z.object({
    condition: ConditionSchema,
  }),
});

export const LoopNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("loop"),
  config: z.object({
    over: z.string(),
    itemVar: z.string().optional(),
  }),
});

export const MergeNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("merge"),
  config: z.object({
    mode: z.enum(["object", "array", "concat"]).default("object"),
  }),
});

export const SetNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("set"),
  config: z.object({
    fields: z.record(z.unknown()),
  }),
});

export const WaitNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("wait"),
  config: z.object({
    seconds: z.number().nonnegative(),
  }),
});

export const StopNodeSchema = z.object({
  ...baseFields,
  kind: z.literal("stop"),
  config: z.object({
    reason: z.string().optional(),
  }),
});

export const NodeSchema = z.discriminatedUnion("kind", [
  TriggerManualNodeSchema,
  TriggerWebhookNodeSchema,
  TriggerScheduleNodeSchema,
  ActionNodeSchema,
  HttpNodeSchema,
  LLMNodeSchema,
  BranchNodeSchema,
  FilterNodeSchema,
  LoopNodeSchema,
  MergeNodeSchema,
  SetNodeSchema,
  WaitNodeSchema,
  StopNodeSchema,
]);
export type NodeJSON = z.infer<typeof NodeSchema>;

export type TriggerManualNodeJSON = z.infer<typeof TriggerManualNodeSchema>;
export type TriggerWebhookNodeJSON = z.infer<typeof TriggerWebhookNodeSchema>;
export type TriggerScheduleNodeJSON = z.infer<typeof TriggerScheduleNodeSchema>;
export type ActionNodeJSON = z.infer<typeof ActionNodeSchema>;
export type HttpNodeJSON = z.infer<typeof HttpNodeSchema>;
export type LLMNodeJSON = z.infer<typeof LLMNodeSchema>;
export type BranchNodeJSON = z.infer<typeof BranchNodeSchema>;
export type FilterNodeJSON = z.infer<typeof FilterNodeSchema>;
export type LoopNodeJSON = z.infer<typeof LoopNodeSchema>;
export type MergeNodeJSON = z.infer<typeof MergeNodeSchema>;
export type SetNodeJSON = z.infer<typeof SetNodeSchema>;
export type WaitNodeJSON = z.infer<typeof WaitNodeSchema>;
export type StopNodeJSON = z.infer<typeof StopNodeSchema>;

// ──────── Classes ────────

export abstract class BaseNode<TConfig = unknown> {
  readonly id: string;
  readonly name: string;
  readonly position?: Position;
  readonly config: TConfig;

  abstract readonly kind: NodeKind;

  protected constructor(data: { id: string; name: string; position?: Position; config: TConfig }) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.config = data.config;
  }

  toJSON(): NodeJSON {
    return {
      id: this.id,
      kind: this.kind,
      name: this.name,
      ...(this.position && { position: this.position }),
      config: this.config as Record<string, unknown>,
    } as NodeJSON;
  }
}

export abstract class TriggerNode<TConfig> extends BaseNode<TConfig> {}

export class TriggerManualNode extends TriggerNode<TriggerManualNodeJSON["config"]> {
  readonly kind = "trigger.manual" as const;
  constructor(data: TriggerManualNodeJSON) {
    super(data);
  }
}

export class TriggerWebhookNode extends TriggerNode<TriggerWebhookNodeJSON["config"]> {
  readonly kind = "trigger.webhook" as const;
  constructor(data: TriggerWebhookNodeJSON) {
    super(data);
  }
}

export class TriggerScheduleNode extends TriggerNode<TriggerScheduleNodeJSON["config"]> {
  readonly kind = "trigger.schedule" as const;
  constructor(data: TriggerScheduleNodeJSON) {
    super(data);
  }
}

export class ActionNode extends BaseNode<ActionNodeJSON["config"]> {
  readonly kind = "action" as const;
  constructor(data: ActionNodeJSON) {
    super(data);
  }
  get integration(): string {
    return this.config.integration;
  }
  get functionName(): string {
    return this.config.function;
  }
}

export class HttpNode extends BaseNode<HttpNodeJSON["config"]> {
  readonly kind = "http" as const;
  constructor(data: HttpNodeJSON) {
    super(data);
  }
}

export class LLMNode extends BaseNode<LLMNodeJSON["config"]> {
  readonly kind = "llm" as const;
  constructor(data: LLMNodeJSON) {
    super(data);
  }
}

export class BranchNode extends BaseNode<BranchNodeJSON["config"]> {
  readonly kind = "branch" as const;
  constructor(data: BranchNodeJSON) {
    super(data);
  }
}

export class FilterNode extends BaseNode<FilterNodeJSON["config"]> {
  readonly kind = "filter" as const;
  constructor(data: FilterNodeJSON) {
    super(data);
  }
}

export class LoopNode extends BaseNode<LoopNodeJSON["config"]> {
  readonly kind = "loop" as const;
  constructor(data: LoopNodeJSON) {
    super(data);
  }
}

export class MergeNode extends BaseNode<MergeNodeJSON["config"]> {
  readonly kind = "merge" as const;
  constructor(data: MergeNodeJSON) {
    super(data);
  }
}

export class SetNode extends BaseNode<SetNodeJSON["config"]> {
  readonly kind = "set" as const;
  constructor(data: SetNodeJSON) {
    super(data);
  }
}

export class WaitNode extends BaseNode<WaitNodeJSON["config"]> {
  readonly kind = "wait" as const;
  constructor(data: WaitNodeJSON) {
    super(data);
  }
}

export class StopNode extends BaseNode<StopNodeJSON["config"]> {
  readonly kind = "stop" as const;
  constructor(data: StopNodeJSON) {
    super(data);
  }
}

export type AnyNode =
  | TriggerManualNode
  | TriggerWebhookNode
  | TriggerScheduleNode
  | ActionNode
  | HttpNode
  | LLMNode
  | BranchNode
  | FilterNode
  | LoopNode
  | MergeNode
  | SetNode
  | WaitNode
  | StopNode;

export function nodeFromJSON(data: NodeJSON): AnyNode {
  switch (data.kind) {
    case "trigger.manual":
      return new TriggerManualNode(data);
    case "trigger.webhook":
      return new TriggerWebhookNode(data);
    case "trigger.schedule":
      return new TriggerScheduleNode(data);
    case "action":
      return new ActionNode(data);
    case "http":
      return new HttpNode(data);
    case "llm":
      return new LLMNode(data);
    case "branch":
      return new BranchNode(data);
    case "filter":
      return new FilterNode(data);
    case "loop":
      return new LoopNode(data);
    case "merge":
      return new MergeNode(data);
    case "set":
      return new SetNode(data);
    case "wait":
      return new WaitNode(data);
    case "stop":
      return new StopNode(data);
  }
}

export function isTriggerKind(kind: NodeKind): boolean {
  return kind.startsWith("trigger.");
}
