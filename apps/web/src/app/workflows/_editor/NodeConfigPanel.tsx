"use client";

import type { NodeKind } from "@fuse/core";

import type { WorkflowFlowNode } from "@/lib/editor/graphConvert";

import { KIND_LABELS } from "./constants";
import { ActionForm } from "./forms/ActionForm";
import { BranchForm } from "./forms/BranchForm";
import { FilterForm } from "./forms/FilterForm";
import { HttpForm } from "./forms/HttpForm";
import { LLMForm } from "./forms/LLMForm";
import { LoopForm } from "./forms/LoopForm";
import { MergeForm } from "./forms/MergeForm";
import { SetForm } from "./forms/SetForm";
import { StopForm } from "./forms/StopForm";
import { TriggerManualForm } from "./forms/TriggerManualForm";
import { TriggerScheduleForm } from "./forms/TriggerScheduleForm";
import { TriggerWebhookForm } from "./forms/TriggerWebhookForm";
import { WaitForm } from "./forms/WaitForm";
import { FormField, inputClass } from "./forms/_FormField";

export interface NodeConfigPanelProps {
  selectedNode: WorkflowFlowNode | null;
  onPatch: (id: string, patch: { name?: string; config?: unknown }) => void;
  onDelete: (id: string) => void;
  onCaseRename: (branchId: string, oldLabel: string, newLabel: string) => void;
  onCaseRemove: (branchId: string, label: string) => void;
}

export function NodeConfigPanel({
  selectedNode,
  onPatch,
  onDelete,
  onCaseRename,
  onCaseRemove,
}: NodeConfigPanelProps) {
  if (!selectedNode) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-neutral-200 bg-white p-4 lg:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
          Inspector
        </div>
        <div className="mt-2 text-sm text-neutral-500">
          Select a node to configure.
        </div>
      </aside>
    );
  }

  const { id, data } = selectedNode;
  const kind = data.kind;
  const config = data.config as Record<string, unknown>;

  function setConfig(next: unknown) {
    onPatch(id, { config: next });
  }

  return (
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white p-4 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
        {KIND_LABELS[kind] ?? kind}
      </div>
      <div className="mt-1 font-mono text-xs text-neutral-500">{id}</div>

      <div className="mt-4 space-y-3">
        <FormField label="Name">
          <input
            type="text"
            className={inputClass}
            value={data.name}
            onChange={(e) => onPatch(id, { name: e.target.value })}
          />
        </FormField>

        {renderForm(kind, id, config, setConfig, onCaseRename, onCaseRemove)}
      </div>

      <button
        type="button"
        onClick={() => onDelete(id)}
        className="mt-6 self-start rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:border-rose-400 hover:text-rose-600 dark:border-neutral-700 dark:text-neutral-400"
      >
        Delete node
      </button>
    </aside>
  );
}

function renderForm(
  kind: NodeKind,
  nodeId: string,
  config: Record<string, unknown>,
  setConfig: (c: unknown) => void,
  onCaseRename: NodeConfigPanelProps["onCaseRename"],
  onCaseRemove: NodeConfigPanelProps["onCaseRemove"],
) {
  switch (kind) {
    case "trigger.manual":
      return <TriggerManualForm />;
    case "trigger.webhook":
      return <TriggerWebhookForm config={config as never} onChange={setConfig} />;
    case "trigger.schedule":
      return <TriggerScheduleForm config={config as never} onChange={setConfig} />;
    case "action":
      return <ActionForm config={config as never} onChange={setConfig} />;
    case "http":
      return <HttpForm config={config as never} onChange={setConfig} />;
    case "llm":
      return <LLMForm config={config as never} onChange={setConfig} />;
    case "branch":
      return (
        <BranchForm
          nodeId={nodeId}
          config={config as never}
          onChange={setConfig}
          onCaseRename={(oldL, newL) => onCaseRename(nodeId, oldL, newL)}
          onCaseRemove={(l) => onCaseRemove(nodeId, l)}
        />
      );
    case "filter":
      return <FilterForm config={config as never} onChange={setConfig} />;
    case "loop":
      return <LoopForm config={config as never} onChange={setConfig} />;
    case "merge":
      return <MergeForm config={config as never} onChange={setConfig} />;
    case "set":
      return <SetForm config={config as never} onChange={setConfig} />;
    case "wait":
      return <WaitForm config={config as never} onChange={setConfig} />;
    case "stop":
      return <StopForm config={config as never} onChange={setConfig} />;
  }
}
