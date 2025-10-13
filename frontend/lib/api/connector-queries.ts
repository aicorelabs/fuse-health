/**
 * React Query hooks for Connector API
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
    listConnectors,
    getConnectorCategories,
    getConnector,
    listConnectorActions,
    getConnectorAction,
    type ConnectorMetadata,
    type ConnectorCategory,
    type ConnectorDetails,
    type ConnectorAction,
} from './connectors';

/**
 * Query key factory for connectors
 */
export const connectorKeys = {
    all: ['connectors'] as const,
    lists: () => [...connectorKeys.all, 'list'] as const,
    list: (filters?: { category?: string }) => [...connectorKeys.lists(), filters] as const,
    categories: () => [...connectorKeys.all, 'categories'] as const,
    details: () => [...connectorKeys.all, 'detail'] as const,
    detail: (id: string) => [...connectorKeys.details(), id] as const,
    actions: (connectorId: string) => [...connectorKeys.detail(connectorId), 'actions'] as const,
    action: (connectorId: string, actionId: string) =>
        [...connectorKeys.actions(connectorId), actionId] as const,
};

/**
 * Hook to fetch all connectors
 */
export function useConnectors(
    params?: {
        category?: string;
    },
    options?: Omit<UseQueryOptions<ConnectorMetadata[], Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<ConnectorMetadata[], Error>({
        queryKey: connectorKeys.list(params),
        queryFn: () => listConnectors(params),
        ...options,
    });
}

/**
 * Hook to fetch connector categories
 */
export function useConnectorCategories(
    options?: Omit<UseQueryOptions<ConnectorCategory[], Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<ConnectorCategory[], Error>({
        queryKey: connectorKeys.categories(),
        queryFn: () => getConnectorCategories(),
        ...options,
    });
}

/**
 * Hook to fetch a single connector with all its actions
 */
export function useConnector(
    connectorId: string,
    options?: Omit<UseQueryOptions<ConnectorDetails, Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<ConnectorDetails, Error>({
        queryKey: connectorKeys.detail(connectorId),
        queryFn: () => getConnector(connectorId),
        enabled: !!connectorId,
        ...options,
    });
}

/**
 * Hook to fetch actions for a connector
 */
export function useConnectorActions(
    connectorId: string,
    params?: {
        category?: string;
    },
    options?: Omit<UseQueryOptions<ConnectorAction[], Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<ConnectorAction[], Error>({
        queryKey: connectorKeys.actions(connectorId),
        queryFn: () => listConnectorActions(connectorId, params),
        enabled: !!connectorId,
        ...options,
    });
}

/**
 * Hook to fetch a specific connector action
 */
export function useConnectorAction(
    connectorId: string,
    actionId: string,
    options?: Omit<UseQueryOptions<ConnectorAction, Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<ConnectorAction, Error>({
        queryKey: connectorKeys.action(connectorId, actionId),
        queryFn: () => getConnectorAction(connectorId, actionId),
        enabled: !!connectorId && !!actionId,
        ...options,
    });
}
