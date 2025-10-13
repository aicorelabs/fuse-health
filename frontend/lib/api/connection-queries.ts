"use client";

import { useMutation, useQuery, useQueryClient, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import {
    fetchConnections,
    fetchConnection,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    fetchServices,
    fetchServiceDetails,
    type Connection,
    type ConnectionCreatePayload,
    type ConnectionUpdatePayload,
    type ConnectionTestResult,
    type ServiceDefinition,
    type ServiceListResponse,
    type ServiceCategory,
} from "./index";

/**
 * Query keys for connection and service queries
 */
export const connectionQueryKeys = {
    all: ["connections"] as const,
    lists: () => [...connectionQueryKeys.all, "list"] as const,
    list: (filters?: { service_type?: string; status?: string }) =>
        [...connectionQueryKeys.lists(), filters] as const,
    details: () => [...connectionQueryKeys.all, "detail"] as const,
    detail: (id: string) => [...connectionQueryKeys.details(), id] as const,
};

export const serviceQueryKeys = {
    all: ["services"] as const,
    lists: () => [...serviceQueryKeys.all, "list"] as const,
    list: (category?: ServiceCategory) => [...serviceQueryKeys.lists(), category] as const,
    details: () => [...serviceQueryKeys.all, "detail"] as const,
    detail: (serviceType: string) => [...serviceQueryKeys.details(), serviceType] as const,
};

/**
 * Hook to fetch all connections with optional filters
 */
export function useConnectionsQuery(
    filters?: { service_type?: string; status?: string },
    options?: Omit<
        UseQueryOptions<Connection[], Error, Connection[], ReturnType<typeof connectionQueryKeys.list>>,
        "queryKey" | "queryFn"
    >
) {
    return useQuery({
        queryKey: connectionQueryKeys.list(filters),
        queryFn: () => fetchConnections(filters),
        staleTime: 30_000, // Consider data fresh for 30 seconds
        ...options,
    });
}

/**
 * Hook to fetch a single connection by ID
 */
export function useConnectionQuery(
    id: string,
    options?: Omit<
        UseQueryOptions<Connection, Error, Connection, ReturnType<typeof connectionQueryKeys.detail>>,
        "queryKey" | "queryFn"
    >
) {
    return useQuery({
        queryKey: connectionQueryKeys.detail(id),
        queryFn: () => fetchConnection(id),
        enabled: Boolean(id),
        ...options,
    });
}

/**
 * Hook to fetch all available services
 */
export function useServicesQuery(
    category?: string,
    options?: Omit<
        UseQueryOptions<ServiceDefinition[], Error, ServiceDefinition[], ReturnType<typeof serviceQueryKeys.list>>,
        "queryKey" | "queryFn"
    >
) {
    return useQuery({
        queryKey: serviceQueryKeys.list(category as any),
        queryFn: () => fetchServices(category),
        staleTime: 5 * 60_000, // Services don't change often, cache for 5 minutes
        ...options,
    });
}

/**
 * Hook to fetch details for a specific service
 */
export function useServiceQuery(
    serviceType: string,
    options?: Omit<
        UseQueryOptions<ServiceDefinition, Error, ServiceDefinition, ReturnType<typeof serviceQueryKeys.detail>>,
        "queryKey" | "queryFn"
    >
) {
    return useQuery({
        queryKey: serviceQueryKeys.detail(serviceType),
        queryFn: () => fetchServiceDetails(serviceType),
        enabled: Boolean(serviceType),
        staleTime: 5 * 60_000,
        ...options,
    });
}

/**
 * Hook to create a new connection
 */
export function useCreateConnectionMutation(
    options?: UseMutationOptions<Connection, Error, ConnectionCreatePayload>
) {
    const queryClient = useQueryClient();

    return useMutation<Connection, Error, ConnectionCreatePayload>({
        mutationKey: ["connections", "create"],
        mutationFn: (payload) => createConnection(payload),
        onSuccess: () => {
            // Invalidate all connection lists to refetch with the new connection
            queryClient.invalidateQueries({ queryKey: connectionQueryKeys.lists() });
        },
        ...options,
    });
}

/**
 * Hook to update an existing connection
 */
export function useUpdateConnectionMutation(
    options?: UseMutationOptions<Connection, Error, { id: string; payload: ConnectionUpdatePayload }>
) {
    const queryClient = useQueryClient();

    return useMutation<Connection, Error, { id: string; payload: ConnectionUpdatePayload }>({
        mutationKey: ["connections", "update"],
        mutationFn: ({ id, payload }) => updateConnection(id, payload),
        onSuccess: (data, variables) => {
            // Update the specific connection in cache
            queryClient.setQueryData(connectionQueryKeys.detail(variables.id), data);
            // Invalidate lists to reflect the update
            queryClient.invalidateQueries({ queryKey: connectionQueryKeys.lists() });
        },
        ...options,
    });
}

/**
 * Hook to delete a connection
 */
export function useDeleteConnectionMutation(
    options?: UseMutationOptions<void, Error, string>
) {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationKey: ["connections", "delete"],
        mutationFn: (id) => deleteConnection(id),
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: connectionQueryKeys.detail(id) });
            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: connectionQueryKeys.lists() });
        },
        ...options,
    });
}

/**
 * Hook to test a connection
 */
export function useTestConnectionMutation(
    options?: UseMutationOptions<ConnectionTestResult, Error, string>
) {
    const queryClient = useQueryClient();

    return useMutation<ConnectionTestResult, Error, string>({
        mutationKey: ["connections", "test"],
        mutationFn: (id) => testConnection(id),
        onSuccess: (data, id) => {
            // If test was successful, invalidate the connection to get updated last_tested_at
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: connectionQueryKeys.detail(id) });
            }
        },
        ...options,
    });
}
