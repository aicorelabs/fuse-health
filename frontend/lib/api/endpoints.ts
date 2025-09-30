import { getBackendBaseUrl } from "../config";
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  CreateTaskResponse,
  HealthResponse,
  ServerOverviewResponse,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskStatusResponse,
} from "./types";

export interface RequestOptions {
  baseUrl?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

async function request<T>(path: string, init?: RequestInit, options?: RequestOptions): Promise<T> {
  const baseUrl = (options?.baseUrl ?? getBackendBaseUrl()).replace(/\/$/, "");
  const url = `${baseUrl}${normalizePath(path)}`;

  const response = await fetch(url, {
    ...init,
    signal: options?.signal ?? init?.signal,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request to ${url} failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export function fetchServerOverview(options?: RequestOptions) {
  return request<ServerOverviewResponse>("/server-overview", undefined, options);
}

export function fetchTasks(status?: TaskStatus, options?: RequestOptions) {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<Task[]>(`/tasks${search}`, undefined, options);
}

export interface CreateTaskPayload {
  description: string;
  priority?: TaskPriority;
  tags?: string[];
}

export function createTask(payload: CreateTaskPayload, options?: RequestOptions) {
  return request<CreateTaskResponse>(
    "/tasks",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    options,
  );
}

export function updateTaskStatus(taskId: string, status: TaskStatus, options?: RequestOptions) {
  return request<UpdateTaskStatusResponse>(
    `/tasks/${encodeURIComponent(taskId)}/status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
    options,
  );
}

export function postChat(payload: ChatRequestPayload, options?: RequestOptions) {
  return request<ChatResponsePayload>(
    "/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    options,
  );
}

export function postExecute(payload: ChatRequestPayload, options?: RequestOptions) {
  return request<ChatResponsePayload>(
    "/execute",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    options,
  );
}

export function fetchHealth(options?: RequestOptions) {
  return request<HealthResponse>("/health", undefined, options);
}
