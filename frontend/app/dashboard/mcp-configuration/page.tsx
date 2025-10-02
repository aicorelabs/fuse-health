"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Trash2, Eye, EyeOff, Save, Edit3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  queryKeys,
  useCreateUserMcpConfigurationMutation,
  useDeleteUserMcpConfigurationMutation,
  useMcpServerDefinitionsQuery,
  useUpdateUserMcpConfigurationMutation,
  useUserMcpConfigurationsQuery,
} from "@/lib/api/queries";
import type { McpServerConfigField, McpServerDefinition, UserMcpConfiguration } from "@/lib/api/types";

const DEMO_USER_ID = "demo-user";

const statusColours: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  draft: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

function formatTimestamp(timestamp?: string | null): string {
  if (!timestamp) {
    return "Not set";
  }
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function coerceConfigValue(field: McpServerConfigField, rawValue: string): unknown {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return field.required ? "" : null;
  }

  switch (field.type) {
    case "number": {
      const numeric = Number(trimmed);
      return Number.isNaN(numeric) ? trimmed : numeric;
    }
    case "json":
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    default:
      return rawValue;
  }
}

function buildConfigPayload(fields: McpServerConfigField[], values: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  fields.forEach((field) => {
    const value = values[field.key] ?? "";
    result[field.key] = coerceConfigValue(field, value);
  });
  return result;
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) return "Not set";
  if (typeof value === "string") return value || "Not set";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function McpConfigurationPage() {
  const userId = DEMO_USER_ID;
  const queryClient = useQueryClient();

  const { data: serverDefinitions = [], isLoading: definitionsLoading, error: serverDefinitionsError } =
    useMcpServerDefinitionsQuery();
  const {
    data: userConfigurations = [],
    isLoading: configurationsLoading,
    error: userConfigurationsError,
  } = useUserMcpConfigurationsQuery(userId);

  const createMutation = useCreateUserMcpConfigurationMutation(userId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userMcpConfigurations(userId) });
      setShowAddForm(false);
      setNewServerConfig({});
      setNewDisplayName("");
    },
  });

  const updateMutation = useUpdateUserMcpConfigurationMutation(userId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userMcpConfigurations(userId) });
      setEditingConfigurationId(null);
    },
  });

  const deleteMutation = useDeleteUserMcpConfigurationMutation(userId, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userMcpConfigurations(userId) });
    },
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedServerSlug, setSelectedServerSlug] = useState<string | null>(null);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newServerConfig, setNewServerConfig] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingConfigurationId, setEditingConfigurationId] = useState<string | null>(null);
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedConfigValues, setEditedConfigValues] = useState<Record<string, string>>({});

  const selectedServerDefinition = useMemo(() => {
    if (!selectedServerSlug) return undefined;
    return serverDefinitions.find((definition) => definition.slug === selectedServerSlug);
  }, [selectedServerSlug, serverDefinitions]);

  useEffect(() => {
    if (!selectedServerSlug && serverDefinitions.length > 0) {
      setSelectedServerSlug(serverDefinitions[0].slug);
    }
  }, [selectedServerSlug, serverDefinitions]);

  useEffect(() => {
    if (showAddForm && selectedServerDefinition) {
      const defaults: Record<string, string> = {};
      selectedServerDefinition.configFields.forEach((field) => {
        defaults[field.key] = field.defaultValue ? String(field.defaultValue) : "";
      });
      setNewServerConfig(defaults);
      setNewDisplayName(selectedServerDefinition.displayName);
    }
  }, [showAddForm, selectedServerDefinition]);

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddServer = () => {
    if (!selectedServerDefinition) return;

    const existingCount = userConfigurations.filter(
      (config) => config.server.slug === selectedServerDefinition.slug,
    ).length;
    const displayName = newDisplayName.trim() || `${selectedServerDefinition.displayName} ${existingCount + 1}`;

    createMutation.mutate({
      serverId: selectedServerDefinition.id,
      displayName,
      configValues: buildConfigPayload(selectedServerDefinition.configFields, newServerConfig),
    });
  };

  const startEditingConfiguration = (config: UserMcpConfiguration) => {
    setEditingConfigurationId(config.id);
    setEditedDisplayName(config.displayName);

    const values: Record<string, string> = {};
    config.server.configFields.forEach((field) => {
      const existingValue = config.configValues[field.key];
      if (existingValue === undefined || existingValue === null) {
        values[field.key] = "";
      } else if (typeof existingValue === "object") {
        try {
          values[field.key] = JSON.stringify(existingValue);
        } catch {
          values[field.key] = String(existingValue);
        }
      } else {
        values[field.key] = String(existingValue);
      }
    });
    setEditedConfigValues(values);
  };

  const handleUpdateConfiguration = (config: UserMcpConfiguration) => {
    updateMutation.mutate({
      configurationId: config.id,
      payload: {
        displayName:
          editedDisplayName.trim() && editedDisplayName.trim() !== config.displayName
            ? editedDisplayName.trim()
            : undefined,
        configValues: buildConfigPayload(config.server.configFields, editedConfigValues),
      },
    });
  };

  const handleToggleStatus = (config: UserMcpConfiguration) => {
    const nextStatus = config.status === "active" ? "inactive" : "active";
    updateMutation.mutate({
      configurationId: config.id,
      payload: {
        status: nextStatus,
      },
    });
  };

  const handleDeleteConfiguration = (config: UserMcpConfiguration) => {
    deleteMutation.mutate({ configurationId: config.id });
  };

  const handleCancelEditing = () => {
    setEditingConfigurationId(null);
    setEditedConfigValues({});
    setEditedDisplayName("");
  };

  const renderConfigurationField = (config: UserMcpConfiguration, field: McpServerConfigField) => {
    const value = config.configValues[field.key];
    const secretKey = `${config.id}-${field.key}`;

    if (field.type === "password" && !showSecrets[secretKey]) {
      return "••••••••";
    }

    return stringifyValue(value);
  };

  const showLoadingState = definitionsLoading || configurationsLoading;

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">MCP Configuration</h1>
          <p className="mt-2 text-white/65">Manage your Model Context Protocol servers and their configurations.</p>
        </div>

        {serverDefinitionsError || userConfigurationsError ? (
          <Card className="mb-6 border-red-500/40">
            <CardHeader>
              <CardTitle className="text-red-400">Unable to load MCP data</CardTitle>
              <CardDescription className="text-red-300/80">
                {(serverDefinitionsError || userConfigurationsError)?.message ?? "Unknown error"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="mb-6">
          <Button onClick={() => setShowAddForm(true)} className="gap-2" disabled={showAddForm || showLoadingState}>
            <Plus className="h-4 w-4" />
            Add MCP Server
          </Button>
        </div>

        {showAddForm && selectedServerDefinition ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New MCP Server</CardTitle>
              <CardDescription>Configure a new Model Context Protocol server.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Server Type</label>
                  <select
                    className="w-full h-11 rounded-xl border border-white/12 bg-transparent px-4 text-sm text-white"
                    value={selectedServerSlug ?? ""}
                    onChange={(event) => {
                      setSelectedServerSlug(event.target.value);
                    }}
                  >
                    {serverDefinitions.map((definition) => (
                      <option key={definition.id} value={definition.slug} className="bg-[#0A0B14] text-white">
                        {definition.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <Input
                    type="text"
                    value={newDisplayName}
                    onChange={(event) => setNewDisplayName(event.target.value)}
                    placeholder="Enter a name for this configuration"
                  />
                </div>

                {selectedServerDefinition.configFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-2">
                      {field.label} {field.required ? <span className="text-red-400">*</span> : null}
                    </label>
                    <div className="relative">
                      <Input
                        type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                        placeholder={field.defaultValue || `Enter ${field.label.toLowerCase()}`}
                        value={newServerConfig[field.key] ?? ""}
                        onChange={(event) =>
                          setNewServerConfig((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                      {field.type === "password" ? (
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility(field.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                        >
                          {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleAddServer} disabled={createMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {createMutation.isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewServerConfig({});
                    }}
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showLoadingState ? (
          <Card>
            <CardContent className="py-12 text-center text-white/60">Loading MCP data…</CardContent>
          </Card>
        ) : null}

        {!showLoadingState && userConfigurations.length > 0 ? (
          <div className="space-y-4">
            {userConfigurations.map((configuration) => {
              const statusClass = statusColours[configuration.status] ?? statusColours.inactive;
              const isEditing = editingConfigurationId === configuration.id;

              return (
                <Card key={configuration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{configuration.displayName}</CardTitle>
                        <Badge className={statusClass}>{configuration.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (isEditing ? handleCancelEditing() : startEditingConfiguration(configuration))}
                        >
                          {isEditing ? <EyeOff className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(configuration)}
                          disabled={updateMutation.isPending}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfiguration(configuration)}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{configuration.server.description ?? "Custom MCP server"}</CardDescription>
                    <p className="text-xs text-white/40">
                      Last updated: {formatTimestamp(configuration.updatedAt || configuration.createdAt)}
                    </p>
                  </CardHeader>

                  {isEditing ? (
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Display Name</label>
                          <Input
                            value={editedDisplayName}
                            onChange={(event) => setEditedDisplayName(event.target.value)}
                            placeholder="Enter a display name"
                          />
                        </div>
                        {configuration.server.configFields.map((field) => {
                          const secretKey = `${configuration.id}-${field.key}`;
                          return (
                            <div key={field.key}>
                              <label className="block text-sm font-medium mb-2">
                                {field.label} {field.required ? <span className="text-red-400">*</span> : null}
                              </label>
                              <div className="relative">
                                <Input
                                  type={field.type === "password" && !showSecrets[secretKey] ? "password" : "text"}
                                  value={editedConfigValues[field.key] ?? ""}
                                  onChange={(event) =>
                                    setEditedConfigValues((prev) => ({
                                      ...prev,
                                      [field.key]: event.target.value,
                                    }))
                                  }
                                />
                                {field.type === "password" ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecretVisibility(secretKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                                  >
                                    {showSecrets[secretKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex gap-3">
                          <Button onClick={() => handleUpdateConfiguration(configuration)} disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={handleCancelEditing} disabled={updateMutation.isPending}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {configuration.server.configFields.map((field) => {
                          const secretKey = `${configuration.id}-${field.key}`;
                          return (
                            <div key={field.key} className="space-y-1">
                              <p className="text-sm font-medium text-white/80">{field.label}</p>
                              <p className="text-sm text-white/60 font-mono">
                                {field.type === "password" && !showSecrets[secretKey]
                                  ? "••••••••"
                                  : renderConfigurationField(configuration, field)}
                              </p>
                              {field.type === "password" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 text-xs text-white/50 hover:text-white"
                                  onClick={() => toggleSecretVisibility(secretKey)}
                                >
                                  {showSecrets[secretKey] ? "Hide" : "Show"}
                                </Button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ) : null}

        {!showLoadingState && userConfigurations.length === 0 && !showAddForm ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-white/40" />
              <h3 className="text-lg font-medium mb-2">No MCP servers configured</h3>
              <p className="text-white/60 mb-4">Get started by adding your first Model Context Protocol server.</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Server
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}