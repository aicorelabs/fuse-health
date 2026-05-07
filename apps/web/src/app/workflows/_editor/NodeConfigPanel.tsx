"use client";

import type { NodeKind } from "@fuse/core";

import type { GraphLike, WorkflowFlowNode } from "@/lib/editor/graphConvert";

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
import { PreviewSection } from "./PreviewSection";
import { ScopePanel, type LastRunSample } from "./ScopePanel";

import type { GraphJSON } from "@fuse/core";

export interface NodeConfigPanelProps {
  selectedNode: WorkflowFlowNode | null;
  graph: GraphLike;
  liveGraphJson: GraphJSON;
  workflowId: string | undefined;
  previewInputText: string;
  onPreviewInputTextChange: (text: string) => void;
  onSampleUpdate: (sample: LastRunSample) => void;
  sample: LastRunSample | null;
  sampleStatus: "idle" | "loading" | "ready" | "missing";
  onPatch: (id: string, patch: { name?: string; config?: unknown }) => void;
  onDelete: (id: string) => void;
  onCaseRename: (branchId: string, oldLabel: string, newLabel: string) => void;
  onCaseRemove: (branchId: string, label: string) => void;
}

export function NodeConfigPanel({
  selectedNode,
  graph,
  liveGraphJson,
  workflowId,
  previewInputText,
  onPreviewInputTextChange,
  onSampleUpdate,
  sample,
  sampleStatus,
  onPatch,
  onDelete,
  onCaseRename,
  onCaseRemove,
}: NodeConfigPanelProps) {
  if (!selectedNode) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-stone-200 bg-white p-5 lg:block dark:border-stone-800 dark:bg-stone-900">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Inspector
        </div>
        <div className="mt-2 text-[12.5px] leading-relaxed text-stone-500 dark:text-stone-500">
          Select a node to configure. Its scope, refs, and sample data appear
          here.
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
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-stone-200 bg-white lg:flex dark:border-stone-800 dark:bg-stone-900">
      <header className="border-b border-stone-100 px-5 py-3 dark:border-stone-800/60">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {KIND_LABELS[kind] ?? kind}
        </div>
        <div className="mt-0.5 font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
          {id}
        </div>
      </header>

      <div className="space-y-6 px-5 py-4">
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

      <div className="space-y-6 border-t border-stone-100 px-5 py-4 dark:border-stone-800/60">
        <ScopePanel
          graph={graph}
          nodeId={id}
          config={config}
          sample={sample}
          sampleStatus={sampleStatus}
        />
        <PreviewSection
          workflowId={workflowId}
          graph={liveGraphJson}
          targetNodeId={id}
          inputText={previewInputText}
          onInputTextChange={onPreviewInputTextChange}
          onSampleUpdate={onSampleUpdate}
        />
      </div>

      <div className="mt-auto border-t border-stone-100 px-5 py-3 dark:border-stone-800/60">
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="rounded-sm border border-stone-200 px-2.5 py-1 text-[11.5px] text-stone-600 transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-stone-800 dark:text-stone-400"
        >
          Delete node
        </button>
      </div>
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
