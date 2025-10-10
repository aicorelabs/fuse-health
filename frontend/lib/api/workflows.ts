import { request, type RequestOptions } from "./endpoints";

// ============= Types =============

export type WorkflowStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
export type ExecutionStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "ERROR" | "CANCELLED" | "PARTIAL";
export type NodeType = "trigger" | "action" | "condition" | "transform" | "delay" | "loop" | "ai";
export type TriggerType = "manual" | "scheduled" | "webhook" | "event";

export interface NodePosition {
    x: number;
    y: number;
}

export interface WorkflowNode {
    id: string;
    type: NodeType;
    position: NodePosition;
    data: {
        label: string;
        serviceType?: string;
        connectionId?: string;
        triggerType?: TriggerType;
        config?: Record<string, any>;
        [key: string]: any;
    };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
}

export interface Workflow {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    status: WorkflowStatus;
    category: string | null;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    executions?: WorkflowExecution[] | null;
}

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    status: ExecutionStatus;
    started_at: string;
    completed_at: string | null;
    error: string | null;
    logs: ExecutionLog[];
    node_results: Record<string, any>;
    metadata: Record<string, any>;
    workflow?: Workflow | null;
}

export interface ExecutionLog {
    timestamp: string;
    level: string;
    message: string;
    node_id: string | null;
    data: any;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    node_count: number;
    edge_count: number;
}

export interface NodeTypeField {
    id: string;
    label: string;
    type: "text" | "email" | "number" | "textarea";
    required?: boolean;
    placeholder?: string;
}

export interface NodeTypeDefinition {
    id: string;
    label: string;
    description: string;
    category: "trigger" | "action" | "data" | "logic" | "ai";
    service_type?: string;
    fields: NodeTypeField[];
}

export interface NodeTypesResponse {
    trigger: NodeTypeDefinition[];
    action: NodeTypeDefinition[];
    data: NodeTypeDefinition[];
    logic: NodeTypeDefinition[];
    ai: NodeTypeDefinition[];
}

// ============= Request/Response Types =============

export interface CreateWorkflowPayload {
    user_id: string;
    name: string;
    description?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
    category?: string;
    metadata?: Record<string, any>;
}

export interface UpdateWorkflowPayload {
    name?: string;
    description?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
    category?: string;
    metadata?: Record<string, any>;
}

export interface ExecuteWorkflowPayload {
    trigger_data?: Record<string, any>;
}

export interface ListWorkflowsParams {
    user_id: string;
    status?: WorkflowStatus;
    category?: string;
    skip?: number;
    take?: number;
}

export interface ListExecutionsParams {
    status?: ExecutionStatus;
    skip?: number;
    take?: number;
}

// ============= Builder API Types =============

export interface TriggerNode {
    id: string;
    position: NodePosition;
    label: string;
    trigger_type?: TriggerType;
    config?: Record<string, any>;
}

export interface ActionNode {
    id: string;
    position: NodePosition;
    label: string;
    service_type: string;
    connection_id?: string;
    config?: Record<string, any>;
}

export interface ConditionNode {
    id: string;
    position: NodePosition;
    label: string;
    condition: string;
    config?: Record<string, any>;
}

export interface TransformNode {
    id: string;
    position: NodePosition;
    label: string;
    transform_type: "map" | "filter" | "aggregate";
    mapping?: Record<string, string>;
    filter_key?: string;
    filter_value?: any;
    config?: Record<string, any>;
}

export interface DelayNode {
    id: string;
    position: NodePosition;
    label: string;
    delay_seconds: number;
    config?: Record<string, any>;
}

export interface LoopNode {
    id: string;
    position: NodePosition;
    label: string;
    loop_type: "foreach" | "while" | "until";
    items?: string;
    condition?: string;
    config?: Record<string, any>;
}

export interface AINode {
    id: string;
    position: NodePosition;
    label: string;
    provider: "openai" | "anthropic" | "gemini";
    model: string;
    prompt: string;
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
    config?: Record<string, any>;
}

export interface CreateWorkflowBuilderPayload {
    user_id: string;
    name: string;
    description?: string;
    category?: string;
    trigger_nodes?: TriggerNode[];
    action_nodes?: ActionNode[];
    condition_nodes?: ConditionNode[];
    transform_nodes?: TransformNode[];
    delay_nodes?: DelayNode[];
    loop_nodes?: LoopNode[];
    ai_nodes?: AINode[];
    edges: WorkflowEdge[];
    metadata?: Record<string, any>;
}

// ============= API Functions =============

/**
 * List workflows for a user
 */
export function listWorkflows(params: ListWorkflowsParams, options?: RequestOptions) {
    const searchParams = new URLSearchParams();
    searchParams.set("user_id", params.user_id);
    if (params.status) searchParams.set("status", params.status);
    if (params.category) searchParams.set("category", params.category);
    if (params.skip !== undefined) searchParams.set("skip", params.skip.toString());
    if (params.take !== undefined) searchParams.set("take", params.take.toString());

    return request<Workflow[]>(`/workflows?${searchParams.toString()}`, undefined, options);
}

/**
 * Get a single workflow by ID
 */
export function getWorkflow(workflowId: string, options?: RequestOptions) {
    return request<Workflow>(`/workflows/${encodeURIComponent(workflowId)}`, undefined, options);
}

/**
 * Create a new workflow (raw JSON format)
 */
export function createWorkflow(payload: CreateWorkflowPayload, options?: RequestOptions) {
    return request<Workflow>(
        "/workflows/",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
        options
    );
}

/**
 * Create a workflow using the builder API (typed nodes)
 */
export function createWorkflowWithBuilder(payload: CreateWorkflowBuilderPayload, options?: RequestOptions) {
    return request<Workflow>(
        "/workflows/builder",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
        options
    );
}

/**
 * Create a simple email workflow (quick helper)
 */
export function createQuickEmailWorkflow(
    params: {
        user_id: string;
        name: string;
        recipient: string;
        subject: string;
        body: string;
        connection_id?: string;
    },
    options?: RequestOptions
) {
    const searchParams = new URLSearchParams();
    searchParams.set("user_id", params.user_id);
    searchParams.set("name", params.name);
    searchParams.set("recipient", params.recipient);
    searchParams.set("subject", params.subject);
    searchParams.set("body", params.body);
    if (params.connection_id) searchParams.set("connection_id", params.connection_id);

    return request<Workflow>(`/workflows/quick/email?${searchParams.toString()}`, { method: "POST" }, options);
}

/**
 * Update a workflow
 */
export function updateWorkflow(workflowId: string, payload: UpdateWorkflowPayload, options?: RequestOptions) {
    return request<Workflow>(
        `/workflows/${encodeURIComponent(workflowId)}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
        options
    );
}

/**
 * Delete a workflow
 */
export function deleteWorkflow(workflowId: string, options?: RequestOptions) {
    return request<{ success: boolean }>(
        `/workflows/${encodeURIComponent(workflowId)}`,
        {
            method: "DELETE",
        },
        options
    );
}

/**
 * Validate a workflow
 */
export function validateWorkflow(workflowId: string, options?: RequestOptions) {
    return request<ValidationResult>(`/workflows/${encodeURIComponent(workflowId)}/validate`, undefined, options);
}

/**
 * Publish a workflow
 */
export function publishWorkflow(workflowId: string, options?: RequestOptions) {
    return request<Workflow>(`/workflows/${encodeURIComponent(workflowId)}/publish`, { method: "POST" }, options);
}

/**
 * Pause a workflow
 */
export function pauseWorkflow(workflowId: string, options?: RequestOptions) {
    return request<Workflow>(`/workflows/${encodeURIComponent(workflowId)}/pause`, { method: "POST" }, options);
}

/**
 * Archive a workflow
 */
export function archiveWorkflow(workflowId: string, options?: RequestOptions) {
    return request<Workflow>(`/workflows/${encodeURIComponent(workflowId)}/archive`, { method: "POST" }, options);
}

/**
 * Execute a workflow
 */
export function executeWorkflow(workflowId: string, payload?: ExecuteWorkflowPayload, options?: RequestOptions) {
    return request<WorkflowExecution>(
        `/workflows/${encodeURIComponent(workflowId)}/execute`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload || {}),
        },
        options
    );
}

/**
 * List executions for a workflow
 */
export function listWorkflowExecutions(
    workflowId: string,
    params?: ListExecutionsParams,
    options?: RequestOptions
) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
    if (params?.take !== undefined) searchParams.set("take", params.take.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request<WorkflowExecution[]>(`/workflows/${encodeURIComponent(workflowId)}/executions${query}`, undefined, options);
}

/**
 * Get a single execution by ID
 */
export function getExecution(executionId: string, options?: RequestOptions) {
    return request<WorkflowExecution>(`/workflows/executions/${encodeURIComponent(executionId)}`, undefined, options);
}

/**
 * Get available node types from backend
 */
export function getNodeTypes(options?: RequestOptions) {
    return request<NodeTypesResponse>(`/workflows/node-types`, undefined, options);
}


/**
 * Cancel a running execution
 */
export function cancelExecution(executionId: string, options?: RequestOptions) {
    return request<{ success: boolean }>(
        `/workflows/executions/${encodeURIComponent(executionId)}/cancel`,
        {
            method: "POST",
        },
        options
    );
}
