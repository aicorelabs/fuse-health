export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "completed" | "blocked" | "cancelled";

export interface Task {
  id: string;
  description: string;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  created_at: string;
  updated_at?: string;
}

export interface CreateTaskResponse {
  success: boolean;
  task: Task;
  message: string;
}

export interface UpdateTaskStatusResponse {
  success: boolean;
  task?: Task;
  message?: string;
  error?: string;
}

export interface ComponentServerDescriptor {
  name: string;
  description: string;
  tools?: string[];
  resources?: string[];
  prompts?: string[];
}

export interface IntegrationStats {
  gemini_ready: boolean;
  total_tools: number;
  total_resources: number;
  total_prompts: number;
}

export interface ServerOverviewResponse {
  main_server: string;
  description: string;
  component_servers: Record<string, ComponentServerDescriptor>;
  integration: IntegrationStats;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponsePayload {
  response: string;
  is_plan: boolean;
}

export interface HealthResponse {
  status: string;
}

export interface PubMedArticleSummary {
  pmid: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
}

export interface PubMedSearchAbstractsArgs {
  query: string;
  limit?: number;
}

export interface PubMedSearchByAuthorArgs {
  author: string;
  limit?: number;
}

export interface PubMedArticleDetailArgs {
  pmid: string;
}

export interface PubMedCapabilitiesResponse {
  tools: string[];
  description: string;
}
