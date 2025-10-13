/**
 * React Query hooks for Integration API
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
    listIntegrations,
    getIntegration,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    refreshOAuthToken,
    type Integration,
    type CreateIntegrationRequest,
    type UpdateIntegrationRequest,
    type TestIntegrationResult,
} from './integrations';

/**
 * Query key factory for integrations
 */
export const integrationKeys = {
    all: ['integrations'] as const,
    lists: () => [...integrationKeys.all, 'list'] as const,
    list: (filters?: { connector_id?: string; category?: string; status?: string }) =>
        [...integrationKeys.lists(), filters] as const,
    details: () => [...integrationKeys.all, 'detail'] as const,
    detail: (id: string) => [...integrationKeys.details(), id] as const,
};

/**
 * Hook to fetch all integrations
 */
export function useIntegrations(
    params?: {
        connector_id?: string;
        category?: string;
        status?: string;
    },
    options?: Omit<UseQueryOptions<Integration[], Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<Integration[], Error>({
        queryKey: integrationKeys.list(params),
        queryFn: () => listIntegrations(params),
        ...options,
    });
}

/**
 * Hook to fetch a single integration
 */
export function useIntegration(
    integrationId: string,
    options?: Omit<UseQueryOptions<Integration, Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<Integration, Error>({
        queryKey: integrationKeys.detail(integrationId),
        queryFn: () => getIntegration(integrationId),
        enabled: !!integrationId,
        ...options,
    });
}

/**
 * Hook to create a new integration
 */
export function useCreateIntegration() {
    const queryClient = useQueryClient();

    return useMutation<Integration, Error, CreateIntegrationRequest>({
        mutationFn: (data) => createIntegration(data),
        onSuccess: () => {
            // Invalidate and refetch integrations list
            queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
        },
    });
}

/**
 * Hook to update an integration
 */
export function useUpdateIntegration() {
    const queryClient = useQueryClient();

    return useMutation<
        Integration,
        Error,
        { integrationId: string; data: UpdateIntegrationRequest }
    >({
        mutationFn: ({ integrationId, data }) => updateIntegration(integrationId, data),
        onSuccess: (data, variables) => {
            // Invalidate specific integration and list
            queryClient.invalidateQueries({ queryKey: integrationKeys.detail(variables.integrationId) });
            queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
        },
    });
}

/**
 * Hook to delete an integration
 */
export function useDeleteIntegration() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (integrationId) => deleteIntegration(integrationId),
        onSuccess: (_, integrationId) => {
            // Remove from cache and invalidate list
            queryClient.removeQueries({ queryKey: integrationKeys.detail(integrationId) });
            queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
        },
    });
}

/**
 * Hook to test an integration
 */
export function useTestIntegration() {
    return useMutation<TestIntegrationResult, Error, string>({
        mutationFn: (integrationId) => testIntegration(integrationId),
    });
}

/**
 * Hook to refresh OAuth token
 */
export function useRefreshOAuthToken() {
    const queryClient = useQueryClient();

    return useMutation<Integration, Error, string>({
        mutationFn: (integrationId) => refreshOAuthToken(integrationId),
        onSuccess: (data, integrationId) => {
            // Update cache with new token data
            queryClient.setQueryData(integrationKeys.detail(integrationId), data);
            queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
        },
    });
}
