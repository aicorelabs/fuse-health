"use client";

import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import {
  createTask,
  createUserMcpConfiguration,
  fetchServerOverview,
  fetchMcpServerDefinitions,
  fetchUserMcpConfigurations,
  fetchTasks,
  postChat,
  postExecute,
  updateUserMcpConfiguration,
  updateTaskStatus,
  deleteUserMcpConfiguration,
} from "./endpoints";
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  CreateTaskResponse,
  CreateUserMcpConfigurationPayload,
  McpServerDefinition,
  ServerOverviewResponse,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateUserMcpConfigurationPayload,
  UserMcpConfiguration,
  UpdateTaskStatusResponse,
} from "./types";

export const queryKeys = {
  serverOverview: ["api", "server-overview"] as const,
  mcpServerDefinitions: ["api", "mcp", "servers"] as const,
  tasks: (status?: TaskStatus) => ["api", "tasks", status ?? "all"] as const,
  userMcpConfigurations: (userId: string) => ["api", "mcp", "users", userId, "configurations"] as const,
};

export function useServerOverviewQuery(
  options?: Omit<
    UseQueryOptions<ServerOverviewResponse, Error, ServerOverviewResponse, typeof queryKeys.serverOverview>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: queryKeys.serverOverview,
    queryFn: () => fetchServerOverview(),
    ...options,
  });
}

export function useTasksQuery(
  status?: TaskStatus,
  options?: Omit<
    UseQueryOptions<Task[], Error, Task[], ReturnType<typeof queryKeys.tasks>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: queryKeys.tasks(status),
    queryFn: () => fetchTasks(status),
    staleTime: 30_000,
    ...options,
  });
}

export function useMcpServerDefinitionsQuery(
  options?: Omit<
    UseQueryOptions<
      McpServerDefinition[],
      Error,
      McpServerDefinition[],
      typeof queryKeys.mcpServerDefinitions
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: queryKeys.mcpServerDefinitions,
    queryFn: () => fetchMcpServerDefinitions(),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useUserMcpConfigurationsQuery(
  userId: string,
  options?: Omit<
    UseQueryOptions<
      UserMcpConfiguration[],
      Error,
      UserMcpConfiguration[],
      ReturnType<typeof queryKeys.userMcpConfigurations>
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: queryKeys.userMcpConfigurations(userId),
    queryFn: () => fetchUserMcpConfigurations(userId),
    enabled: Boolean(userId),
    ...options,
  });
}

export function useCreateTaskMutation(
  options?: UseMutationOptions<
    CreateTaskResponse,
    Error,
    { description: string; priority?: TaskPriority; tags?: string[] }
  >,
) {
  return useMutation<CreateTaskResponse, Error, { description: string; priority?: TaskPriority; tags?: string[] }>({
    mutationKey: ["api", "tasks", "create"],
    mutationFn: (variables) =>
      createTask({
        description: variables.description,
        priority: variables.priority,
        tags: variables.tags,
      }),
    ...options,
  });
}

export function useUpdateTaskStatusMutation(
  options?: UseMutationOptions<UpdateTaskStatusResponse, Error, { taskId: string; status: TaskStatus }>,
) {
  return useMutation<UpdateTaskStatusResponse, Error, { taskId: string; status: TaskStatus }>({
    mutationKey: ["api", "tasks", "update-status"],
    mutationFn: ({ taskId, status }) => updateTaskStatus(taskId, status),
    ...options,
  });
}

export function useCreateUserMcpConfigurationMutation(
  userId: string,
  options?: UseMutationOptions<UserMcpConfiguration, Error, CreateUserMcpConfigurationPayload>,
) {
  return useMutation<UserMcpConfiguration, Error, CreateUserMcpConfigurationPayload>({
    mutationKey: ["api", "mcp", "users", userId, "configurations", "create"],
    mutationFn: (payload) => createUserMcpConfiguration(userId, payload),
    ...options,
  });
}

export function useUpdateUserMcpConfigurationMutation(
  userId: string,
  options?: UseMutationOptions<
    UserMcpConfiguration,
    Error,
    { configurationId: string; payload: UpdateUserMcpConfigurationPayload }
  >,
) {
  return useMutation<
    UserMcpConfiguration,
    Error,
    { configurationId: string; payload: UpdateUserMcpConfigurationPayload }
  >({
    mutationKey: ["api", "mcp", "users", userId, "configurations", "update"],
    mutationFn: ({ configurationId, payload }) =>
      updateUserMcpConfiguration(userId, configurationId, payload),
    ...options,
  });
}

export function useDeleteUserMcpConfigurationMutation(
  userId: string,
  options?: UseMutationOptions<void, Error, { configurationId: string }>,
) {
  return useMutation<void, Error, { configurationId: string }>({
    mutationKey: ["api", "mcp", "users", userId, "configurations", "delete"],
    mutationFn: ({ configurationId }) =>
      deleteUserMcpConfiguration(userId, configurationId).then(() => undefined),
    ...options,
  });
}

export function useChatMutation(
  options?: UseMutationOptions<ChatResponsePayload, Error, ChatRequestPayload>,
) {
  return useMutation<ChatResponsePayload, Error, ChatRequestPayload>({
    mutationKey: ["api", "chat"],
    mutationFn: (variables) => postChat(variables),
    ...options,
  });
}

export function useExecutePlanMutation(
  options?: UseMutationOptions<ChatResponsePayload, Error, ChatRequestPayload>,
) {
  return useMutation<ChatResponsePayload, Error, ChatRequestPayload>({
    mutationKey: ["api", "execute-plan"],
    mutationFn: (variables) => postExecute(variables),
    ...options,
  });
}
