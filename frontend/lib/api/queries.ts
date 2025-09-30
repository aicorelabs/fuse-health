"use client";

import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import {
  createTask,
  fetchServerOverview,
  fetchTasks,
  postChat,
  postExecute,
  updateTaskStatus,
} from "./endpoints";
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  CreateTaskResponse,
  ServerOverviewResponse,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskStatusResponse,
} from "./types";

export const queryKeys = {
  serverOverview: ["api", "server-overview"] as const,
  tasks: (status?: TaskStatus) => ["api", "tasks", status ?? "all"] as const,
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
