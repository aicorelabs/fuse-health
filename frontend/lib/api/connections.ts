import type { RequestOptions } from "./endpoints";
import { request } from "./endpoints";

export interface Connection {
    id: string;
    user_id: string;
    service_type: string;
    display_name: string;
    auth_type: "oauth2" | "api_key" | "basic_auth" | "bearer_token" | "client_credentials";
    auth_config?: Record<string, any>;
    status: "active" | "expired" | "error" | "revoked";
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    last_tested_at?: string;
}

export interface ConnectionCreatePayload {
    service_type: string;
    display_name: string;
    auth_type: string;
    auth_config?: Record<string, any>;
    credentials: Record<string, any>;
    status?: string;
}

export interface ConnectionUpdatePayload {
    display_name?: string;
    status?: string;
    auth_config?: Record<string, any>;
    credentials?: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface ConnectionTestResult {
    success: boolean;
    message: string;
    tested_at: string;
}

export function fetchConnections(
    filters?: {
        service_type?: string;
        status?: string;
    },
    options?: RequestOptions
) {
    const params = new URLSearchParams();
    if (filters?.service_type) params.append("service_type", filters.service_type);
    if (filters?.status) params.append("status", filters.status);

    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Connection[]>(`/connections${query}`, undefined, options);
}

export function fetchConnection(id: string, options?: RequestOptions) {
    return request<Connection>(`/connections/${id}`, undefined, options);
}

export function createConnection(
    payload: ConnectionCreatePayload,
    options?: RequestOptions
) {
    return request<Connection>(
        "/connections",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        },
        options
    );
}

export function updateConnection(
    id: string,
    payload: ConnectionUpdatePayload,
    options?: RequestOptions
) {
    return request<Connection>(
        `/connections/${id}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        },
        options
    );
}

export function deleteConnection(id: string, options?: RequestOptions) {
    return request<void>(
        `/connections/${id}`,
        { method: "DELETE" },
        options
    );
}

export function testConnection(id: string, options?: RequestOptions) {
    return request<ConnectionTestResult>(
        `/connections/${id}/test`,
        { method: "POST" },
        options
    );
}
