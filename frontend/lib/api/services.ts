import { request, RequestOptions } from "./endpoints";

/**
 * Service definitions from the backend
 */

export enum ServiceCategory {
    EMAIL = "email",
    STORAGE = "storage",
    AI = "ai",
    HEALTHCARE = "healthcare",
    RESEARCH = "research",
    COMMUNICATION = "communication",
    MEDICAL_IMAGING = "medical_imaging",
    CRM = "crm",
    ANALYTICS = "analytics",
    PRODUCTIVITY = "productivity",
    DATA = "data",
    CLINICAL = "clinical",
    OTHER = "other",
}

export enum AuthType {
    OAUTH2 = "oauth2",
    API_KEY = "api_key",
    BASIC_AUTH = "basic_auth",
    BEARER_TOKEN = "bearer_token",
    CLIENT_CREDENTIALS = "client_credentials",
    SSH_KEY = "ssh_key",
    CUSTOM = "custom",
}

export interface ServiceDefinition {
    service_type: string;
    display_name: string;
    description: string;
    icon?: string;
    category: string;
    auth_type: string;
    auth_config?: Record<string, any>;
    capabilities?: string[];
    documentation_url?: string;
    requires_setup?: boolean;
    test_endpoint?: string;
}

export interface ServiceListResponse {
    services: ServiceDefinition[];
    count: number;
}

/**
 * Fetch all available services
 * @param category Optional filter by service category
 * @param options Request options
 */
export function fetchServices(category?: string, options?: RequestOptions) {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<ServiceDefinition[]>(`/services${query}`, undefined, options);
}

/**
 * Fetch details for a specific service
 * @param serviceType The service type identifier (e.g., 'openai', 'gmail')
 * @param options Request options
 */
export function fetchServiceDetails(serviceType: string, options?: RequestOptions) {
    return request<ServiceDefinition>(`/services/${encodeURIComponent(serviceType)}`, undefined, options);
}

/**
 * Get available service categories
 */
export function getServiceCategories(): ServiceCategory[] {
    return Object.values(ServiceCategory);
}

/**
 * Group services by category
 * @param services List of service definitions
 */
export function groupServicesByCategory(services: ServiceDefinition[]): Record<string, ServiceDefinition[]> {
    const grouped: Record<string, ServiceDefinition[]> = {};

    // Group services
    services.forEach(service => {
        const category = service.category || ServiceCategory.OTHER;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(service);
    });

    return grouped;
}

/**
 * Get display label for auth type
 */
export function getAuthTypeLabel(authType: string): string {
    const labels: Record<string, string> = {
        [AuthType.OAUTH2]: "OAuth 2.0",
        [AuthType.API_KEY]: "API Key",
        [AuthType.BASIC_AUTH]: "Basic Authentication",
        [AuthType.BEARER_TOKEN]: "Bearer Token",
        [AuthType.CLIENT_CREDENTIALS]: "Client Credentials",
        [AuthType.SSH_KEY]: "SSH Key",
        [AuthType.CUSTOM]: "Custom",
    };
    return labels[authType] || authType;
}

/**
 * Get display label for service category
 */
export function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        [ServiceCategory.EMAIL]: "Email",
        [ServiceCategory.STORAGE]: "Storage",
        [ServiceCategory.AI]: "Artificial Intelligence",
        [ServiceCategory.HEALTHCARE]: "Healthcare",
        [ServiceCategory.RESEARCH]: "Research",
        [ServiceCategory.COMMUNICATION]: "Communication",
        [ServiceCategory.MEDICAL_IMAGING]: "Medical Imaging",
        [ServiceCategory.CRM]: "CRM",
        [ServiceCategory.ANALYTICS]: "Analytics",
        [ServiceCategory.PRODUCTIVITY]: "Productivity",
        [ServiceCategory.DATA]: "Data",
        [ServiceCategory.CLINICAL]: "Clinical",
        [ServiceCategory.OTHER]: "Other",
    };
    return labels[category] || category;
}
