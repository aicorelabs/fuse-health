/**
 * Connector API Client
 * 
 * Browse available connectors and their actions.
 */

import { request, RequestOptions } from './endpoints';

export interface ConnectorMetadata {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    icon: string;
    auth_type: string;
    requires_oauth: boolean;
    action_count: number;
    oauth_config?: {
        authorize_url: string;
        scopes: string[];
    };
}

export interface ConnectorAction {
    id: string;
    name: string;
    description: string;
    category: string;
    parameters: ActionParameter[];
}

export interface ActionParameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
}

export interface ConnectorCategory {
    name: string;
    connector_count: number;
}

export interface ConnectorDetails extends ConnectorMetadata {
    actions: ConnectorAction[];
}

/**
 * List all available connectors
 */
export async function listConnectors(params?: {
    category?: string;
}, options?: RequestOptions): Promise<ConnectorMetadata[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);

    const url = `/connectors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return request<ConnectorMetadata[]>(url, undefined, options);
}

/**
 * Get all connector categories with counts
 */
export async function getConnectorCategories(options?: RequestOptions): Promise<ConnectorCategory[]> {
    return request<ConnectorCategory[]>('/connectors/categories', undefined, options);
}

/**
 * Get details of a specific connector including all actions
 */
export async function getConnector(connectorId: string, options?: RequestOptions): Promise<ConnectorDetails> {
    return request<ConnectorDetails>(`/connectors/${connectorId}`, undefined, options);
}

/**
 * List actions for a specific connector
 */
export async function listConnectorActions(
    connectorId: string,
    params?: {
        category?: string;
    },
    options?: RequestOptions
): Promise<ConnectorAction[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);

    const url = `/connectors/${connectorId}/actions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return request<ConnectorAction[]>(url, undefined, options);
}

/**
 * Get details of a specific connector action
 */
export async function getConnectorAction(
    connectorId: string,
    actionId: string,
    options?: RequestOptions
): Promise<ConnectorAction> {
    return request<ConnectorAction>(
        `/connectors/${connectorId}/actions/${actionId}`,
        undefined,
        options
    );
}
