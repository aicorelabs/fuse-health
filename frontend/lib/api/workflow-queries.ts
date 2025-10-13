import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import * as workflowsApi from "./workflows";
import * as endpoints from "./endpoints";
import type {
    CreateWorkflowPayload,
    CreateWorkflowBuilderPayload,
    UpdateWorkflowPayload,
    ExecuteWorkflowPayload,
    ListWorkflowsParams,
    ListExecutionsParams,
    Workflow,
    WorkflowExecution,
    ValidationResult,
} from "./workflows";

// ============= Query Keys =============

export const workflowKeys = {
    all: ["workflows"] as const,
    lists: () => [...workflowKeys.all, "list"] as const,
    list: (params: ListWorkflowsParams) => [...workflowKeys.lists(), params] as const,
    details: () => [...workflowKeys.all, "detail"] as const,
    detail: (id: string) => [...workflowKeys.details(), id] as const,
    executions: (id: string) => [...workflowKeys.detail(id), "executions"] as const,
    executionsList: (id: string, params?: ListExecutionsParams) => [...workflowKeys.executions(id), params] as const,
    validation: (id: string) => [...workflowKeys.detail(id), "validation"] as const,
    nodeTypes: () => [...workflowKeys.all, "node-types"] as const,
    analytics: (userId: string, days: number) => [...workflowKeys.all, "analytics", userId, days] as const,
};

// ============= Queries =============

/**
 * Hook to get available node types from backend
 */
export function useNodeTypes(userId?: string, options?: UseQueryOptions<workflowsApi.NodeTypesResponse>) {
    return useQuery({
        queryKey: [...workflowKeys.nodeTypes(), userId],
        queryFn: () => workflowsApi.getNodeTypes(userId),
        staleTime: 1000 * 60 * 5, // 5 minutes - refresh more frequently to reflect integration changes
        ...options,
    });
}

/**
 * Hook to list workflows
 */
export function useWorkflows(params: ListWorkflowsParams, options?: UseQueryOptions<Workflow[]>) {
    return useQuery({
        queryKey: workflowKeys.list(params),
        queryFn: () => workflowsApi.listWorkflows(params),
        ...options,
    });
}

/**
 * Hook to get a single workflow
 */
export function useWorkflow(workflowId: string, options?: UseQueryOptions<Workflow>) {
    return useQuery({
        queryKey: workflowKeys.detail(workflowId),
        queryFn: () => workflowsApi.getWorkflow(workflowId),
        enabled: !!workflowId,
        ...options,
    });
}

/**
 * Hook to validate a workflow
 */
export function useWorkflowValidation(workflowId: string, options?: UseQueryOptions<ValidationResult>) {
    return useQuery({
        queryKey: workflowKeys.validation(workflowId),
        queryFn: () => workflowsApi.validateWorkflow(workflowId),
        enabled: !!workflowId,
        ...options,
    });
}

/**
 * Hook to list workflow executions
 */
export function useWorkflowExecutions(
    workflowId: string,
    params?: ListExecutionsParams,
    options?: UseQueryOptions<WorkflowExecution[]>
) {
    return useQuery({
        queryKey: workflowKeys.executionsList(workflowId, params),
        queryFn: () => workflowsApi.listWorkflowExecutions(workflowId, params),
        enabled: !!workflowId,
        ...options,
    });
}

/**
 * Hook to get a single execution
 */
export function useExecution(executionId: string, options?: UseQueryOptions<WorkflowExecution>) {
    return useQuery({
        queryKey: ["executions", executionId],
        queryFn: () => workflowsApi.getExecution(executionId),
        enabled: !!executionId,
        ...options,
    });
}

/**
 * Hook to get workflow analytics
 */
export function useWorkflowAnalytics(
    userId: string,
    days: number = 7,
    options?: UseQueryOptions<endpoints.WorkflowAnalyticsResponse>
) {
    return useQuery({
        queryKey: workflowKeys.analytics(userId, days),
        queryFn: () => endpoints.fetchWorkflowAnalytics(userId, days),
        enabled: !!userId,
        ...options,
    });
}

// ============= Mutations =============

/**
 * Hook to create a workflow
 */
export function useCreateWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateWorkflowPayload) => workflowsApi.createWorkflow(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(data.id), data);
        },
    });
}

/**
 * Hook to create a workflow with the builder API
 */
export function useCreateWorkflowWithBuilder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateWorkflowBuilderPayload) => workflowsApi.createWorkflowWithBuilder(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(data.id), data);
        },
    });
}

/**
 * Hook to create a quick email workflow
 */
export function useCreateQuickEmailWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: Parameters<typeof workflowsApi.createQuickEmailWorkflow>[0]) =>
            workflowsApi.createQuickEmailWorkflow(params),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(data.id), data);
        },
    });
}

/**
 * Hook to update a workflow
 */
export function useUpdateWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ workflowId, payload }: { workflowId: string; payload: UpdateWorkflowPayload }) =>
            workflowsApi.updateWorkflow(workflowId, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(variables.workflowId), data);
        },
    });
}

/**
 * Hook to delete a workflow
 */
export function useDeleteWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workflowId: string) => workflowsApi.deleteWorkflow(workflowId),
        onSuccess: (_, workflowId) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.removeQueries({ queryKey: workflowKeys.detail(workflowId) });
        },
    });
}

/**
 * Hook to publish a workflow
 */
export function usePublishWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workflowId: string) => workflowsApi.publishWorkflow(workflowId),
        onSuccess: (data, workflowId) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(workflowId), data);
        },
    });
}

/**
 * Hook to pause a workflow
 */
export function usePauseWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workflowId: string) => workflowsApi.pauseWorkflow(workflowId),
        onSuccess: (data, workflowId) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(workflowId), data);
        },
    });
}

/**
 * Hook to archive a workflow
 */
export function useArchiveWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workflowId: string) => workflowsApi.archiveWorkflow(workflowId),
        onSuccess: (data, workflowId) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.setQueryData(workflowKeys.detail(workflowId), data);
        },
    });
}

/**
 * Hook to execute a workflow
 */
export function useExecuteWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ workflowId, payload }: { workflowId: string; payload?: ExecuteWorkflowPayload }) =>
            workflowsApi.executeWorkflow(workflowId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.executions(variables.workflowId) });
        },
    });
}

/**
 * Hook to cancel an execution
 */
export function useCancelExecution() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (executionId: string) => workflowsApi.cancelExecution(executionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.all });
        },
    });
}
