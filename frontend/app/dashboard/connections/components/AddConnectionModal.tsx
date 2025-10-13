"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AuthType,
    completeOAuthFlow,
    type ConnectionCreatePayload,
    getAuthTypeLabel,
    getCategoryLabel,
    groupServicesByCategory,
    type ServiceDefinition,
    useCreateConnectionMutation,
} from "@/lib/api";

interface AddConnectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    services: ServiceDefinition[];
    servicesLoading: boolean;
}

type Step = "select-service" | "configure-auth";

export function AddConnectionModal({
    open,
    onOpenChange,
    services,
    servicesLoading,
}: AddConnectionModalProps) {
    const [step, setStep] = useState<Step>("select-service");
    const [selectedService, setSelectedService] = useState<
        ServiceDefinition | null
    >(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [credentials, setCredentials] = useState<Record<string, string>>({});

    const createMutation = useCreateConnectionMutation();

    // Filter services based on search
    const filteredServices = services.filter((service) =>
        service.display_name.toLowerCase().includes(
            searchQuery.toLowerCase(),
        ) ||
        service.service_type.toLowerCase().includes(
            searchQuery.toLowerCase(),
        ) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedServices = groupServicesByCategory(filteredServices);

    const handleServiceSelect = (service: ServiceDefinition) => {
        setSelectedService(service);
        setDisplayName(`${service.display_name} Connection`);
        setStep("configure-auth");

        // Initialize credentials based on auth type
        if (service.auth_type === AuthType.API_KEY) {
            setCredentials({ api_key: "" });
        } else if (service.auth_type === AuthType.BASIC_AUTH) {
            setCredentials({ username: "", password: "" });
        } else if (service.auth_type === AuthType.BEARER_TOKEN) {
            setCredentials({ token: "" });
        }
    };

    const handleBack = () => {
        setStep("select-service");
        setSelectedService(null);
        setCredentials({});
    };

    const handleClose = () => {
        setStep("select-service");
        setSelectedService(null);
        setSearchQuery("");
        setDisplayName("");
        setCredentials({});
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!selectedService) return;

        // OAuth2 requires special handling - open popup flow
        if (selectedService.auth_type === AuthType.OAUTH2) {
            try {
                createMutation.mutate(
                    { service_type: selectedService.service_type } as any,
                    {
                        onSuccess: () => {},
                    },
                );

                // Start OAuth flow
                const result = await completeOAuthFlow({
                    service_type: selectedService.service_type,
                    user_id: "user_demo_001", // TODO: Get from auth context
                    display_name: displayName,
                });

                if (result.success) {
                    alert(
                        `✓ ${
                            result.message || "Connection created successfully!"
                        }`,
                    );
                    handleClose();
                    // Trigger refetch of connections
                    window.location.reload();
                } else {
                    alert(`✗ ${result.error || "OAuth flow failed"}`);
                }
            } catch (error) {
                alert(
                    `Error: ${
                        error instanceof Error
                            ? error.message
                            : "OAuth flow failed"
                    }`,
                );
            } finally {
                createMutation.reset();
            }
            return;
        }

        const payload: ConnectionCreatePayload = {
            service_type: selectedService.service_type,
            display_name: displayName,
            auth_type: selectedService.auth_type,
            credentials,
            auth_config: selectedService.auth_config,
            status: "active",
        };

        createMutation.mutate(payload, {
            onSuccess: () => {
                alert("Connection created successfully!");
                handleClose();
            },
            onError: (error) => {
                alert(`Error creating connection: ${error.message}`);
            },
        });
    };

    const isFormValid = () => {
        if (!displayName.trim()) return false;

        if (selectedService?.auth_type === AuthType.API_KEY) {
            return credentials.api_key?.trim().length > 0;
        } else if (selectedService?.auth_type === AuthType.BASIC_AUTH) {
            return credentials.username?.trim().length > 0 &&
                credentials.password?.trim().length > 0;
        } else if (selectedService?.auth_type === AuthType.BEARER_TOKEN) {
            return credentials.token?.trim().length > 0;
        }

        return true;
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-[#101322] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {step === "select-service"
                                ? "Add Connection"
                                : `Configure ${selectedService?.display_name}`}
                        </h2>
                        <p className="text-sm text-white/60 mt-1">
                            {step === "select-service"
                                ? "Select a service to connect"
                                : "Enter your authentication credentials"}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {step === "select-service"
                        ? (
                            <div className="space-y-6">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                    <Input
                                        placeholder="Search services..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)}
                                        className="pl-10 bg-[#0C0F1C] border-white/10 text-white placeholder:text-white/40"
                                    />
                                </div>

                                {/* Services Grid */}
                                {servicesLoading
                                    ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                        </div>
                                    )
                                    : (
                                        <div className="space-y-6">
                                            {Object.entries(groupedServices)
                                                .map(
                                                    (
                                                        [
                                                            category,
                                                            categoryServices,
                                                        ],
                                                    ) => {
                                                        if (
                                                            categoryServices
                                                                .length === 0
                                                        ) return null;

                                                        return (
                                                            <div key={category}>
                                                                <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wide">
                                                                    {getCategoryLabel(
                                                                        category,
                                                                    )}
                                                                </h3>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {categoryServices
                                                                        .map((
                                                                            service,
                                                                        ) => (
                                                                            <button
                                                                                key={service
                                                                                    .service_type}
                                                                                onClick={() =>
                                                                                    handleServiceSelect(
                                                                                        service,
                                                                                    )}
                                                                                className="p-4 border border-white/10 bg-[#0C0F1C] rounded-lg hover:border-primary/50 hover:bg-[#121527] transition-all text-left group"
                                                                            >
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                                                                        <span className="text-sm font-semibold text-primary">
                                                                                            {service
                                                                                                .service_type
                                                                                                .slice(
                                                                                                    0,
                                                                                                    2,
                                                                                                ).toUpperCase()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <h4 className="font-medium text-sm text-white">
                                                                                            {service
                                                                                                .display_name}
                                                                                        </h4>
                                                                                        <p className="text-xs text-white/50 mt-0.5 truncate">
                                                                                            {service
                                                                                                .description}
                                                                                        </p>
                                                                                        <p className="text-xs text-primary/80 mt-1">
                                                                                            {getAuthTypeLabel(
                                                                                                service
                                                                                                    .auth_type,
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                        </div>
                                    )}
                            </div>
                        )
                        : (
                            <div className="space-y-6">
                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white/90 mb-2">
                                        Connection Name
                                    </label>
                                    <Input
                                        value={displayName}
                                        onChange={(e) =>
                                            setDisplayName(e.target.value)}
                                        placeholder="Enter a name for this connection"
                                        className="bg-[#0C0F1C] border-white/10 text-white placeholder:text-white/40"
                                    />
                                </div>

                                {/* Auth Type Info */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <p className="text-sm text-blue-300">
                                        <span className="font-medium">
                                            Authentication Type:
                                        </span>{" "}
                                        {getAuthTypeLabel(
                                            selectedService?.auth_type || "",
                                        )}
                                    </p>
                                    {selectedService?.description && (
                                        <p className="text-sm text-blue-200/80 mt-2">
                                            {selectedService.description}
                                        </p>
                                    )}
                                </div>

                                {/* Credentials Form */}
                                {selectedService?.auth_type === AuthType.OAUTH2
                                    ? (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                            <p className="text-sm text-amber-200">
                                                This service uses OAuth 2.0.
                                                Click "Continue" to be
                                                redirected to{" "}
                                                {selectedService.display_name}
                                                {" "}
                                                to authorize access.
                                            </p>
                                        </div>
                                    )
                                    : selectedService?.auth_type ===
                                            AuthType.API_KEY
                                    ? (
                                        <div>
                                            <label className="block text-sm font-medium text-white/90 mb-2">
                                                API Key
                                            </label>
                                            <Input
                                                type="password"
                                                value={credentials.api_key ||
                                                    ""}
                                                onChange={(e) =>
                                                    setCredentials({
                                                        ...credentials,
                                                        api_key: e.target.value,
                                                    })}
                                                placeholder="Enter your API key"
                                                className="bg-[#0C0F1C] border-white/10 text-white placeholder:text-white/40"
                                            />
                                            {selectedService
                                                .documentation_url && (
                                                <a
                                                    href={selectedService
                                                        .documentation_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline mt-1 inline-block"
                                                >
                                                    Where do I find my API key?
                                                </a>
                                            )}
                                        </div>
                                    )
                                    : selectedService?.auth_type ===
                                            AuthType.BASIC_AUTH
                                    ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-white/90 mb-2">
                                                    Username
                                                </label>
                                                <Input
                                                    value={credentials
                                                        .username || ""}
                                                    onChange={(e) =>
                                                        setCredentials({
                                                            ...credentials,
                                                            username:
                                                                e.target.value,
                                                        })}
                                                    placeholder="Enter username"
                                                    className="bg-[#0C0F1C] border-white/10 text-white placeholder:text-white/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/90 mb-2">
                                                    Password
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={credentials
                                                        .password || ""}
                                                    onChange={(e) =>
                                                        setCredentials({
                                                            ...credentials,
                                                            password:
                                                                e.target.value,
                                                        })}
                                                    placeholder="Enter password"
                                                    className="bg-[#0C0F1C] border-white/10 text-white placeholder:text-white/40"
                                                />
                                            </div>
                                        </>
                                    )
                                    : selectedService?.auth_type ===
                                            AuthType.BEARER_TOKEN
                                    ? (
                                        <div>
                                            <label className="block text-sm font-medium text-white/90 mb-2">
                                                Bearer Token
                                            </label>
                                            <Input
                                                type="password"
                                                value={credentials.token || ""}
                                                onChange={(e) =>
                                                    setCredentials({
                                                        ...credentials,
                                                        token: e.target.value,
                                                    })}
                                                placeholder="Enter your bearer token"
                                                className="bg-[#0C0F1C] border-white/10 text-white placeholder:text-white/40"
                                            />
                                        </div>
                                    )
                                    : (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                            <p className="text-sm text-white/70">
                                                Custom authentication
                                                configuration required.
                                            </p>
                                        </div>
                                    )}
                            </div>
                        )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/10 bg-[#0C0F1C]">
                    {step === "configure-auth"
                        ? (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                    Back
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleClose}
                                        className="border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!isFormValid() ||
                                            createMutation.isPending}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {createMutation.isPending
                                            ? "Creating..."
                                            : "Create Connection"}
                                    </Button>
                                </div>
                            </>
                        )
                        : (
                            <div className="flex justify-end w-full">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
