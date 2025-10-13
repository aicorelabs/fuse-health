/**
 * Comprehensive Workflow Validation System
 * Based on enterprise-grade workflow validation rules
 */

import type { FlowNode, FlowEdge, NodeConfigField } from "./types";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationMessage {
    nodeId?: string;
    edgeId?: string;
    severity: ValidationSeverity;
    code: string;
    message: string;
    field?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationMessage[];
    warnings: ValidationMessage[];
    info: ValidationMessage[];
}

type NodeCategory = "trigger" | "data" | "logic" | "ai" | "action";

/**
 * Type compatibility matrix for data flow validation
 */
const TYPE_COMPATIBILITY: Record<string, string[]> = {
    string: ["string", "number", "boolean", "object", "any"],
    number: ["string", "number", "boolean", "any"],
    boolean: ["string", "number", "boolean", "any"],
    object: ["string", "object", "any"],
    array: ["string", "array", "any"],
    any: ["string", "number", "boolean", "object", "array", "any"],
};

/**
 * Main Workflow Validator Class
 */
export class WorkflowValidator {
    private nodes: FlowNode[];
    private edges: FlowEdge[];
    private result: ValidationResult;

    constructor(nodes: FlowNode[], edges: FlowEdge[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.result = {
            isValid: true,
            errors: [],
            warnings: [],
            info: [],
        };
    }

    /**
     * Run all validation checks
     */
    validate(): ValidationResult {
        // 1. Structural validation
        this.validateStructure();

        // 2. Node-level validation
        this.nodes.forEach((node) => this.validateNode(node));

        // 3. Edge-level validation
        this.edges.forEach((edge) => this.validateEdge(edge));

        // 4. Data flow validation
        this.validateDataFlow();

        // 5. Execution path validation
        this.validateExecutionPaths();

        // 6. Determine overall validity
        this.result.isValid = this.result.errors.length === 0;

        return this.result;
    }

    /**
     * 1. STRUCTURAL VALIDATION
     */
    private validateStructure(): void {
        // Check for empty workflow
        if (this.nodes.length === 0) {
            this.addError({
                code: "EMPTY_WORKFLOW",
                message: "Workflow must contain at least one node",
            });
            return;
        }

        // Check for trigger node
        this.validateTriggerNode();

        // Check for minimum nodes
        if (this.nodes.length < 2) {
            this.addWarning({
                code: "INSUFFICIENT_NODES",
                message: "Workflow should have at least 2 nodes (trigger + action)",
            });
        }

        // Check for duplicate node IDs
        this.validateUniqueNodeIds();

        // Check for duplicate edge IDs
        this.validateUniqueEdgeIds();

        // Check for cycles
        this.detectCycles();

        // Check for disconnected nodes
        this.validateConnectivity();
    }

    private validateTriggerNode(): void {
        const triggerNodes = this.nodes.filter((node) => this.isTriggerNode(node));

        if (triggerNodes.length === 0) {
            this.addError({
                code: "MISSING_TRIGGER",
                message: "Workflow must have exactly one trigger node to start execution",
            });
        } else if (triggerNodes.length > 1) {
            this.addError({
                code: "MULTIPLE_TRIGGERS",
                message: `Found ${triggerNodes.length} trigger nodes. Only one trigger is allowed per workflow`,
            });
            triggerNodes.slice(1).forEach((node) => {
                this.addError({
                    nodeId: node.id,
                    code: "DUPLICATE_TRIGGER",
                    message: `Remove this duplicate trigger node: "${node.data.label}"`,
                });
            });
        } else {
            // Validate trigger node connections
            const trigger = triggerNodes[0];
            const incomingEdges = this.getIncomingEdges(trigger.id);

            if (incomingEdges.length > 0) {
                this.addError({
                    nodeId: trigger.id,
                    code: "TRIGGER_HAS_INPUT",
                    message: "Trigger node cannot have incoming connections",
                });
            }

            const outgoingEdges = this.getOutgoingEdges(trigger.id);
            if (outgoingEdges.length === 0) {
                this.addWarning({
                    nodeId: trigger.id,
                    code: "TRIGGER_NO_OUTPUT",
                    message: "Trigger node has no outgoing connections",
                });
            }
        }
    }

    private validateUniqueNodeIds(): void {
        const idCounts = new Map<string, number>();
        this.nodes.forEach((node) => {
            idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
        });

        idCounts.forEach((count, id) => {
            if (count > 1) {
                this.addError({
                    code: "DUPLICATE_NODE_ID",
                    message: `Node ID "${id}" is used ${count} times. Each node must have a unique ID`,
                });
            }
        });
    }

    private validateUniqueEdgeIds(): void {
        const idCounts = new Map<string, number>();
        this.edges.forEach((edge) => {
            idCounts.set(edge.id, (idCounts.get(edge.id) || 0) + 1);
        });

        idCounts.forEach((count, id) => {
            if (count > 1) {
                this.addError({
                    code: "DUPLICATE_EDGE_ID",
                    message: `Edge ID "${id}" is used ${count} times. Each edge must have a unique ID`,
                });
            }
        });
    }

    private detectCycles(): void {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string, path: string[]): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const outgoingEdges = this.getOutgoingEdges(nodeId);

            for (const edge of outgoingEdges) {
                const targetNode = this.getNode(edge.target);
                if (!targetNode) continue;

                // Allow cycles for loop nodes (they're intentional)
                if (this.isLoopNode(targetNode)) continue;

                if (!visited.has(edge.target)) {
                    if (dfs(edge.target, [...path])) return true;
                } else if (recursionStack.has(edge.target)) {
                    const cycleNodes = [...path, edge.target].map(
                        (id) => this.getNode(id)?.data.label || id
                    );
                    this.addError({
                        code: "CYCLE_DETECTED",
                        message: `Cycle detected: ${cycleNodes.join(" → ")}`,
                        edgeId: edge.id,
                    });
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        const triggerNodes = this.nodes.filter((node) => this.isTriggerNode(node));
        if (triggerNodes.length > 0) {
            dfs(triggerNodes[0].id, []);
        }
    }

    private validateConnectivity(): void {
        if (this.nodes.length === 0) return;

        const triggerNodes = this.nodes.filter((node) => this.isTriggerNode(node));
        if (triggerNodes.length === 0) return;

        const reachable = this.getReachableNodes(triggerNodes[0].id);
        const unreachableNodes = this.nodes.filter(
            (node) => !reachable.has(node.id) && !this.isTriggerNode(node)
        );

        unreachableNodes.forEach((node) => {
            this.addWarning({
                nodeId: node.id,
                code: "UNREACHABLE_NODE",
                message: `Node "${node.data.label}" is not reachable from trigger`,
            });
        });
    }

    /**
     * 2. NODE-LEVEL VALIDATION
     */
    private validateNode(node: FlowNode): void {
        // Validate based on node category
        const category = this.getNodeCategory(node);

        switch (category) {
            case "trigger":
                this.validateTriggerNodeSpecific(node);
                break;
            case "logic":
                this.validateLogicNode(node);
                break;
            case "action":
                this.validateActionNode(node);
                break;
            case "data":
                this.validateDataNode(node);
                break;
            case "ai":
                this.validateAINode(node);
                break;
        }

        // Validate configuration fields
        this.validateNodeConfiguration(node);

        // Validate connectors
        this.validateNodeConnectors(node);
    }

    private validateTriggerNodeSpecific(node: FlowNode): void {
        const config = node.data.config;

        // Check for schedule trigger configuration
        if (node.id.includes("schedule")) {
            if (!config.cadence || config.cadence.trim() === "") {
                this.addError({
                    nodeId: node.id,
                    code: "MISSING_SCHEDULE_CADENCE",
                    message: "Schedule trigger must have a cadence configured",
                    field: "cadence",
                });
            }

            if (!config.time || config.time.trim() === "") {
                this.addWarning({
                    nodeId: node.id,
                    code: "MISSING_SCHEDULE_TIME",
                    message: "Schedule trigger should have a time configured",
                    field: "time",
                });
            }
        }

        // Check for event trigger configuration
        if (node.id.includes("event-trigger") || node.id.includes("trigger-lab")) {
            if (!config.event || config.event.trim() === "") {
                this.addError({
                    nodeId: node.id,
                    code: "MISSING_EVENT_TYPE",
                    message: "Event trigger must have an event type configured",
                    field: "event",
                });
            }
        }
    }

    private validateLogicNode(node: FlowNode): void {
        const incomingEdges = this.getIncomingEdges(node.id);
        const outgoingEdges = this.getOutgoingEdges(node.id);

        // Logic nodes must have incoming connection
        if (incomingEdges.length === 0) {
            this.addError({
                nodeId: node.id,
                code: "LOGIC_NO_INPUT",
                message: `Logic node "${node.data.label}" has no incoming connection`,
            });
        }

        // Validate filter/branch nodes
        if (this.isFilterNode(node)) {
            this.validateFilterNode(node, outgoingEdges);
        }

        // Validate loop nodes
        if (this.isLoopNode(node)) {
            this.validateLoopNode(node, outgoingEdges);
        }
    }

    private validateFilterNode(node: FlowNode, outgoingEdges: FlowEdge[]): void {
        const config = node.data.config;

        // Check for condition expression
        if (!config.expression || config.expression.trim() === "") {
            this.addError({
                nodeId: node.id,
                code: "MISSING_FILTER_EXPRESSION",
                message: "Filter node must have a condition expression",
                field: "expression",
            });
        } else {
            // Validate expression syntax (basic check)
            this.validateExpression(node.id, config.expression);
        }

        // Check for both branches
        const connectors = node.data.connectors || [];
        const trueConnector = connectors.find((c) => c.id.includes("true"));
        const falseConnector = connectors.find((c) => c.id.includes("false"));

        const trueConnected = outgoingEdges.some(
            (e) => e.sourceHandle === trueConnector?.id
        );
        const falseConnected = outgoingEdges.some(
            (e) => e.sourceHandle === falseConnector?.id
        );

        if (!trueConnected) {
            this.addWarning({
                nodeId: node.id,
                code: "FILTER_TRUE_BRANCH_UNCONNECTED",
                message: "Filter's 'true' branch is not connected",
            });
        }

        if (!falseConnected) {
            this.addWarning({
                nodeId: node.id,
                code: "FILTER_FALSE_BRANCH_UNCONNECTED",
                message: "Filter's 'false' branch is not connected",
            });
        }

        // Check for multiple incoming connections (should be single)
        const incomingEdges = this.getIncomingEdges(node.id);
        if (incomingEdges.length > 1) {
            this.addWarning({
                nodeId: node.id,
                code: "FILTER_MULTIPLE_INPUTS",
                message: "Filter node has multiple incoming connections",
            });
        }
    }

    private validateLoopNode(node: FlowNode, outgoingEdges: FlowEdge[]): void {
        const config = node.data.config;

        // Check for iterator configuration
        if (!config.iterator || config.iterator.trim() === "") {
            this.addError({
                nodeId: node.id,
                code: "MISSING_LOOP_ITERATOR",
                message: "Loop node must have an iterator configured",
                field: "iterator",
            });
        }

        // Check for loop body and completion connections
        const connectors = node.data.connectors || [];
        const iterateConnector = connectors.find((c) => c.id.includes("iterate"));
        const completeConnector = connectors.find((c) => c.id.includes("complete"));

        const iterateConnected = outgoingEdges.some(
            (e) => e.sourceHandle === iterateConnector?.id
        );
        const completeConnected = outgoingEdges.some(
            (e) => e.sourceHandle === completeConnector?.id
        );

        if (!iterateConnected) {
            this.addWarning({
                nodeId: node.id,
                code: "LOOP_BODY_UNCONNECTED",
                message: "Loop iteration path is not connected",
            });
        }

        if (!completeConnected) {
            this.addWarning({
                nodeId: node.id,
                code: "LOOP_COMPLETION_UNCONNECTED",
                message: "Loop completion path is not connected",
            });
        }

        // Validate that loop body doesn't create cycle back to loop
        if (iterateConnected) {
            const iterateEdges = outgoingEdges.filter(
                (e) => e.sourceHandle === iterateConnector?.id
            );
            iterateEdges.forEach((edge) => {
                if (this.createsLoopCycle(edge.target, node.id)) {
                    this.addError({
                        nodeId: node.id,
                        code: "LOOP_CYCLE_DETECTED",
                        message: "Loop body creates a cycle back to the loop node",
                        edgeId: edge.id,
                    });
                }
            });
        }
    }

    private validateActionNode(node: FlowNode): void {
        const incomingEdges = this.getIncomingEdges(node.id);

        // Action nodes must have incoming connection
        if (incomingEdges.length === 0) {
            this.addError({
                nodeId: node.id,
                code: "ACTION_NO_INPUT",
                message: `Action node "${node.data.label}" has no incoming connection`,
            });
        }

        // Validate specific action types
        if (node.id.includes("gmail") || node.id.includes("email")) {
            this.validateEmailAction(node);
        }

        if (node.id.includes("epic-write") || node.id.includes("file")) {
            this.validateEpicAction(node);
        }

        if (node.id.includes("notification") || node.id.includes("notify")) {
            this.validateNotificationAction(node);
        }

        // Check if action is terminal or should continue
        const outgoingEdges = this.getOutgoingEdges(node.id);
        if (outgoingEdges.length === 0) {
            this.addInfo({
                nodeId: node.id,
                code: "TERMINAL_ACTION",
                message: `Action "${node.data.label}" is a terminal node (workflow ends here)`,
            });
        }
    }

    private validateEmailAction(node: FlowNode): void {
        const config = node.data.config;

        if (!config.to || config.to.trim() === "") {
            this.addError({
                nodeId: node.id,
                code: "EMAIL_MISSING_RECIPIENT",
                message: "Email action must have a recipient address",
                field: "to",
            });
        }

        if (!config.subject || config.subject.trim() === "") {
            this.addWarning({
                nodeId: node.id,
                code: "EMAIL_MISSING_SUBJECT",
                message: "Email should have a subject line",
                field: "subject",
            });
        }

        if (!config.connection || config.connection.trim() === "") {
            this.addError({
                nodeId: node.id,
                code: "EMAIL_MISSING_CONNECTION",
                message: "Email action requires a Gmail connection",
                field: "connection",
            });
        }
    }

    private validateEpicAction(node: FlowNode): void {
        const config = node.data.config;

        if (
            node.id.includes("epic-write") &&
            (!config.resource || config.resource.trim() === "")
        ) {
            this.addError({
                nodeId: node.id,
                code: "EPIC_MISSING_RESOURCE",
                message: "Epic action must specify a resource type",
                field: "resource",
            });
        }

        if (
            node.id.includes("epic-write") &&
            (!config.data || config.data.trim() === "")
        ) {
            this.addError({
                nodeId: node.id,
                code: "EPIC_MISSING_DATA",
                message: "Epic action must have data to write",
                field: "data",
            });
        }
    }

    private validateNotificationAction(node: FlowNode): void {
        const config = node.data.config;

        if (!config.channel || config.channel.trim() === "") {
            this.addError({
                nodeId: node.id,
                code: "NOTIFICATION_MISSING_CHANNEL",
                message: "Notification must specify a channel",
                field: "channel",
            });
        }

        if (!config.message || config.message.trim() === "") {
            this.addError({
                nodeId: node.id,
                code: "NOTIFICATION_MISSING_MESSAGE",
                message: "Notification must have a message",
                field: "message",
            });
        }
    }

    private validateDataNode(node: FlowNode): void {
        const incomingEdges = this.getIncomingEdges(node.id);

        // Data nodes must have incoming connection (except if they're data sources)
        if (incomingEdges.length === 0 && !this.isTriggerNode(node)) {
            this.addWarning({
                nodeId: node.id,
                code: "DATA_NO_INPUT",
                message: `Data node "${node.data.label}" has no incoming connection`,
            });
        }

        // Validate Google Sheets configuration
        if (node.id.includes("sheet") || node.id.includes("google-sheets")) {
            const config = node.data.config;

            if (!config.sheetUrl || config.sheetUrl.trim() === "") {
                this.addError({
                    nodeId: node.id,
                    code: "SHEET_MISSING_URL",
                    message: "Google Sheets action requires a sheet URL",
                    field: "sheetUrl",
                });
            }
        }
    }

    private validateAINode(node: FlowNode): void {
        const incomingEdges = this.getIncomingEdges(node.id);

        // AI nodes must have incoming connection
        if (incomingEdges.length === 0) {
            this.addError({
                nodeId: node.id,
                code: "AI_NO_INPUT",
                message: `AI node "${node.data.label}" has no incoming connection`,
            });
        }

        const config = node.data.config;

        // Check for prompt/instructions
        const hasPrompt = config.prompt && config.prompt.trim() !== "";
        const hasInstructions =
            config.instructions && config.instructions.trim() !== "";

        if (!hasPrompt && !hasInstructions) {
            this.addError({
                nodeId: node.id,
                code: "AI_MISSING_PROMPT",
                message: "AI node must have a prompt or instructions",
                field: "prompt",
            });
        }

        // Validate prompt length (minimum meaningful length)
        const promptText = config.prompt || config.instructions || "";
        if (promptText.length > 0 && promptText.length < 10) {
            this.addWarning({
                nodeId: node.id,
                code: "AI_SHORT_PROMPT",
                message: "AI prompt is very short - consider adding more context",
                field: config.prompt ? "prompt" : "instructions",
            });
        }
    }

    private validateNodeConfiguration(node: FlowNode): void {
        const configFields = node.data.configFields || [];

        configFields.forEach((field) => {
            if (field.required) {
                const value = node.data.config[field.id];
                if (!value || value.trim() === "") {
                    this.addError({
                        nodeId: node.id,
                        code: "MISSING_REQUIRED_FIELD",
                        message: `Required field "${field.label}" is not configured`,
                        field: field.id,
                    });
                }
            }
        });
    }

    private validateNodeConnectors(node: FlowNode): void {
        const connectors = node.data.connectors || [];
        const incomingEdges = this.getIncomingEdges(node.id);
        const outgoingEdges = this.getOutgoingEdges(node.id);

        // Check for unused target connectors
        const targetConnectors = connectors.filter((c) => c.type === "target");
        targetConnectors.forEach((connector) => {
            const isUsed = incomingEdges.some((e) => e.targetHandle === connector.id);
            if (!isUsed && !this.isTriggerNode(node)) {
                // This is informational only, not an error
                this.addInfo({
                    nodeId: node.id,
                    code: "UNUSED_INPUT_CONNECTOR",
                    message: `Input connector "${connector.label || "in"}" is unused`,
                });
            }
        });
    }

    /**
     * 3. EDGE-LEVEL VALIDATION
     */
    private validateEdge(edge: FlowEdge): void {
        const sourceNode = this.getNode(edge.source);
        const targetNode = this.getNode(edge.target);

        // Validate source node exists
        if (!sourceNode) {
            this.addError({
                edgeId: edge.id,
                code: "EDGE_INVALID_SOURCE",
                message: "Edge connects from non-existent source node",
            });
            return;
        }

        // Validate target node exists
        if (!targetNode) {
            this.addError({
                edgeId: edge.id,
                code: "EDGE_INVALID_TARGET",
                message: "Edge connects to non-existent target node",
            });
            return;
        }

        // Validate handles exist
        this.validateEdgeHandles(edge, sourceNode, targetNode);

        // Validate no self-loops
        if (edge.source === edge.target) {
            this.addError({
                edgeId: edge.id,
                code: "EDGE_SELF_LOOP",
                message: "Node cannot connect to itself",
            });
        }

        // Check for duplicate edges
        this.validateDuplicateEdges(edge);
    }

    private validateEdgeHandles(
        edge: FlowEdge,
        sourceNode: FlowNode,
        targetNode: FlowNode
    ): void {
        const sourceConnectors = sourceNode.data.connectors || [];
        const targetConnectors = targetNode.data.connectors || [];

        const sourceConnector = sourceConnectors.find(
            (c) => c.id === edge.sourceHandle
        );
        const targetConnector = targetConnectors.find(
            (c) => c.id === edge.targetHandle
        );

        if (!sourceConnector) {
            this.addError({
                edgeId: edge.id,
                code: "EDGE_INVALID_SOURCE_HANDLE",
                message: `Source handle "${edge.sourceHandle}" does not exist on node "${sourceNode.data.label}"`,
            });
        }

        if (!targetConnector) {
            this.addError({
                edgeId: edge.id,
                code: "EDGE_INVALID_TARGET_HANDLE",
                message: `Target handle "${edge.targetHandle}" does not exist on node "${targetNode.data.label}"`,
            });
        }
    }

    private validateDuplicateEdges(edge: FlowEdge): void {
        const duplicates = this.edges.filter(
            (e) =>
                e.id !== edge.id &&
                e.source === edge.source &&
                e.target === edge.target &&
                e.sourceHandle === edge.sourceHandle &&
                e.targetHandle === edge.targetHandle
        );

        if (duplicates.length > 0) {
            this.addWarning({
                edgeId: edge.id,
                code: "DUPLICATE_EDGE",
                message: "Duplicate connection detected between same nodes and handles",
            });
        }
    }

    /**
     * 4. DATA FLOW VALIDATION
     */
    private validateDataFlow(): void {
        // Validate variable references in node configurations
        this.nodes.forEach((node) => {
            this.validateVariableReferences(node);
        });
    }

    private validateVariableReferences(node: FlowNode): void {
        const config = node.data.config;

        Object.entries(config).forEach(([key, value]) => {
            if (typeof value === "string") {
                // Check for variable references like {{trigger.payload.field}} or {{nodes.nodeId.output.field}}
                const variablePattern = /\{\{([^}]+)\}\}/g;
                let match;

                while ((match = variablePattern.exec(value)) !== null) {
                    const varReference = match[1].trim();
                    this.validateVariableReference(node.id, varReference, key);
                }
            }
        });
    }

    private validateVariableReference(
        nodeId: string,
        reference: string,
        field: string
    ): void {
        // Check if reference is to trigger
        if (reference.startsWith("trigger.")) {
            const triggerNodes = this.nodes.filter((n) => this.isTriggerNode(n));
            if (triggerNodes.length === 0) {
                this.addError({
                    nodeId,
                    code: "VARIABLE_INVALID_TRIGGER",
                    message: `Variable reference "${reference}" requires a trigger node`,
                    field,
                });
            }
            return;
        }

        // Check if reference is to another node
        if (reference.startsWith("nodes.")) {
            const parts = reference.split(".");
            if (parts.length < 2) {
                this.addError({
                    nodeId,
                    code: "VARIABLE_INVALID_SYNTAX",
                    message: `Invalid variable reference syntax: "${reference}"`,
                    field,
                });
                return;
            }

            const referencedNodeId = parts[1];
            const referencedNode = this.getNode(referencedNodeId);

            if (!referencedNode) {
                this.addError({
                    nodeId,
                    code: "VARIABLE_NODE_NOT_FOUND",
                    message: `Referenced node "${referencedNodeId}" does not exist`,
                    field,
                });
                return;
            }

            // Check if referenced node is reachable before current node
            if (!this.isNodeBeforeAnother(referencedNodeId, nodeId)) {
                this.addError({
                    nodeId,
                    code: "VARIABLE_FORWARD_REFERENCE",
                    message: `Cannot reference node "${referencedNode.data.label}" that executes after current node`,
                    field,
                });
            }
        }
    }

    private validateExpression(nodeId: string, expression: string): void {
        // Basic expression validation
        if (expression.trim() === "") {
            this.addError({
                nodeId,
                code: "EMPTY_EXPRESSION",
                message: "Expression cannot be empty",
                field: "expression",
            });
            return;
        }

        // Check for balanced brackets/parentheses
        const brackets = { "(": ")", "[": "]", "{": "}" };
        const stack: string[] = [];

        for (const char of expression) {
            if (char in brackets) {
                stack.push(char);
            } else if (Object.values(brackets).includes(char)) {
                const last = stack.pop();
                if (!last || brackets[last as keyof typeof brackets] !== char) {
                    this.addError({
                        nodeId,
                        code: "EXPRESSION_UNBALANCED_BRACKETS",
                        message: "Expression has unbalanced brackets or parentheses",
                        field: "expression",
                    });
                    return;
                }
            }
        }

        if (stack.length > 0) {
            this.addError({
                nodeId,
                code: "EXPRESSION_UNBALANCED_BRACKETS",
                message: "Expression has unbalanced brackets or parentheses",
                field: "expression",
            });
        }

        // Check for comparison operators (basic validation)
        const hasComparison = /[=!<>]=?|===?|!==?/.test(expression);
        const hasLogicalOp = /&&|\|\||!/.test(expression);

        if (!hasComparison && !hasLogicalOp && expression.length > 0) {
            this.addWarning({
                nodeId,
                code: "EXPRESSION_NO_COMPARISON",
                message: "Expression might not evaluate to a boolean value",
                field: "expression",
            });
        }
    }

    /**
     * 5. EXECUTION PATH VALIDATION
     */
    private validateExecutionPaths(): void {
        const triggerNodes = this.nodes.filter((node) => this.isTriggerNode(node));
        if (triggerNodes.length === 0) return;

        const reachableNodes = this.getReachableNodes(triggerNodes[0].id);

        // Check for terminal nodes
        const hasTerminalNode = this.nodes.some((node) => {
            const outgoingEdges = this.getOutgoingEdges(node.id);
            return outgoingEdges.length === 0 && reachableNodes.has(node.id);
        });

        if (!hasTerminalNode && this.nodes.length > 1) {
            this.addWarning({
                code: "NO_TERMINAL_NODE",
                message: "Workflow should have at least one terminal node (end point)",
            });
        }

        // Suggest adding error handling
        const hasErrorHandling = this.nodes.some(
            (node) =>
                node.data.label.toLowerCase().includes("error") ||
                node.data.label.toLowerCase().includes("fallback")
        );

        if (!hasErrorHandling && this.nodes.length > 3) {
            this.addInfo({
                code: "CONSIDER_ERROR_HANDLING",
                message: "Consider adding error handling nodes for production workflows",
            });
        }
    }

    /**
     * HELPER METHODS
     */
    private isTriggerNode(node: FlowNode): boolean {
        const inputConnectors =
            node.data.connectors?.filter((c) => c.type === "target") || [];
        return inputConnectors.length === 0;
    }

    private isFilterNode(node: FlowNode): boolean {
        return (
            node.id.includes("filter") ||
            node.data.label.toLowerCase().includes("filter") ||
            node.data.label.toLowerCase().includes("branch")
        );
    }

    private isLoopNode(node: FlowNode): boolean {
        return (
            node.id.includes("loop") ||
            node.data.label.toLowerCase().includes("loop") ||
            node.data.label.toLowerCase().includes("iterate")
        );
    }

    private getNodeCategory(node: FlowNode): NodeCategory {
        if (this.isTriggerNode(node)) return "trigger";
        if (node.data.chipText === "Logic") return "logic";
        if (node.data.chipText === "Action") return "action";
        if (node.data.chipText === "Data") return "data";
        if (node.data.chipText === "Agent" || node.data.chipText === "AI Agent") {
            return "ai";
        }
        return "action"; // default
    }

    private getNode(nodeId: string): FlowNode | undefined {
        return this.nodes.find((n) => n.id === nodeId);
    }

    private getIncomingEdges(nodeId: string): FlowEdge[] {
        return this.edges.filter((e) => e.target === nodeId);
    }

    private getOutgoingEdges(nodeId: string): FlowEdge[] {
        return this.edges.filter((e) => e.source === nodeId);
    }

    private getReachableNodes(startNodeId: string): Set<string> {
        const reachable = new Set<string>();
        const queue = [startNodeId];

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (reachable.has(nodeId)) continue;

            reachable.add(nodeId);

            const outgoingEdges = this.getOutgoingEdges(nodeId);
            outgoingEdges.forEach((edge) => {
                if (!reachable.has(edge.target)) {
                    queue.push(edge.target);
                }
            });
        }

        return reachable;
    }

    private isNodeBeforeAnother(
        beforeNodeId: string,
        afterNodeId: string
    ): boolean {
        const visited = new Set<string>();
        const queue = [beforeNodeId];

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            if (nodeId === afterNodeId) return true;

            visited.add(nodeId);

            const outgoingEdges = this.getOutgoingEdges(nodeId);
            outgoingEdges.forEach((edge) => {
                if (!visited.has(edge.target)) {
                    queue.push(edge.target);
                }
            });
        }

        return false;
    }

    private createsLoopCycle(startNodeId: string, targetNodeId: string): boolean {
        return this.isNodeBeforeAnother(startNodeId, targetNodeId);
    }

    private addError(message: Omit<ValidationMessage, "severity">): void {
        this.result.errors.push({ ...message, severity: "error" });
    }

    private addWarning(message: Omit<ValidationMessage, "severity">): void {
        this.result.warnings.push({ ...message, severity: "warning" });
    }

    private addInfo(message: Omit<ValidationMessage, "severity">): void {
        this.result.info.push({ ...message, severity: "info" });
    }
}

/**
 * Convenience function to validate a workflow
 */
export function validateWorkflow(
    nodes: FlowNode[],
    edges: FlowEdge[]
): ValidationResult {
    const validator = new WorkflowValidator(nodes, edges);
    return validator.validate();
}
