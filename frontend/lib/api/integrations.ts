/**
 * Integration API Client
 * 
 * Replaces the old connections API with the new integration/connector system.
 */

import { request, RequestOptions } from './endpoints';

export interface Integration {
    id: string;
    connector_id: string;
    display_name: string;
    category: string;
    auth_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    last_used_at?: string;
    token_expires_at?: string;
    connector_metadata?: {
        name: string;
        description: string;
        icon: string;
    };
}

export interface CreateIntegrationRequest {
    connector_id: string;
    display_name: string;
    credentials: Record<string, any>;
}

export interface UpdateIntegrationRequest {
    display_name?: string;
    credentials?: Record<string, any>;
    status?: string;
}

export interface TestIntegrationResult {
    success: boolean;
    message: string;
    connector: string;
    action_tested?: string;
    details?: any;
    error?: string;
}

/**
 * List all integrations for the current user
 */
export async function listIntegrations(params?: {
    connector_id?: string;
    category?: string;
    status?: string;
}, options?: RequestOptions): Promise<Integration[]> {
    const queryParams = new URLSearchParams();
    if (params?.connector_id) queryParams.append('connector_id', params.connector_id);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/integrations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return request<Integration[]>(url, undefined, options);
}

/**
 * Get a specific integration by ID
 */
export async function getIntegration(integrationId: string, options?: RequestOptions): Promise<Integration> {
    return request<Integration>(`/integrations/${integrationId}`, undefined, options);
}

/**
 * Create a new integration
 */
export async function createIntegration(data: CreateIntegrationRequest, options?: RequestOptions): Promise<Integration> {
    return request<Integration>('/integrations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }, options);
}

/**
 * Update an existing integration
 */
export async function updateIntegration(
    integrationId: string,
    data: UpdateIntegrationRequest,
    options?: RequestOptions
): Promise<Integration> {
    return request<Integration>(`/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }, options);
}

/**
 * Delete an integration
 */
export async function deleteIntegration(integrationId: string, options?: RequestOptions): Promise<void> {
    return request<void>(`/integrations/${integrationId}`, {
        method: 'DELETE',
    }, options);
}

/**
 * Test an integration by executing a test action
 */
export async function testIntegration(integrationId: string, options?: RequestOptions): Promise<TestIntegrationResult> {
    return request<TestIntegrationResult>(`/integrations/${integrationId}/test`, {
        method: 'POST',
    }, options);
}

/**
 * Refresh OAuth token for an integration
 */
export async function refreshOAuthToken(integrationId: string, options?: RequestOptions): Promise<Integration> {
    return request<Integration>(`/integrations/${integrationId}/refresh-token`, {
        method: 'POST',
    }, options);
}
