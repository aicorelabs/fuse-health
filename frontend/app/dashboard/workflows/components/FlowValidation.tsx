"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import type { FlowEdge, FlowNode } from "./types";
import { validateWorkflow, type ValidationResult } from "./WorkflowValidator";

interface FlowValidationProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/**
 * Hook to validate workflow using comprehensive validation rules
 */
export function useFlowValidation(
  nodes: FlowNode[],
  edges: FlowEdge[],
): ValidationResult {
  return useMemo(() => {
    if (nodes.length === 0) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        info: [],
      };
    }

    return validateWorkflow(nodes, edges);
  }, [nodes, edges]);
}

export function FlowValidation({ nodes, edges }: FlowValidationProps) {
  const validation = useFlowValidation(nodes, edges);
  const [expandedSections, setExpandedSections] = useState({
    errors: true,
    warnings: true,
    info: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { errors, warnings, info } = validation;
  const totalIssues = errors.length + warnings.length + info.length;

  // Show success state if no issues
  if (totalIssues === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
        <CheckCircle className="h-4 w-4" />
        <span>Workflow validation passed - all checks successful</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10">
          <button
            onClick={() => toggleSection("errors")}
            className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-red-500/5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span>Errors ({errors.length}) - Must fix to publish</span>
            </div>
            {expandedSections.errors
              ? <ChevronUp className="h-3.5 w-3.5 text-red-300" />
              : <ChevronDown className="h-3.5 w-3.5 text-red-300" />}
          </button>

          {expandedSections.errors && (
            <div className="border-t border-red-500/20 px-3 pb-2 pt-1">
              <ul className="space-y-2">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-xs">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-red-400">•</span>
                      <div className="flex-1">
                        <p className="text-red-200/90">{error.message}</p>
                        {error.code && (
                          <p className="mt-0.5 font-mono text-[10px] text-red-300/60">
                            {error.code}
                          </p>
                        )}
                        {error.nodeId && (
                          <p className="mt-0.5 text-[10px] text-red-300/50">
                            Node: {error.nodeId}
                            {error.field && ` • Field: ${error.field}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10">
          <button
            onClick={() => toggleSection("warnings")}
            className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-amber-500/5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span>Warnings ({warnings.length}) - Should review</span>
            </div>
            {expandedSections.warnings
              ? <ChevronUp className="h-3.5 w-3.5 text-amber-300" />
              : <ChevronDown className="h-3.5 w-3.5 text-amber-300" />}
          </button>

          {expandedSections.warnings && (
            <div className="border-t border-amber-500/20 px-3 pb-2 pt-1">
              <ul className="space-y-2">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-amber-400">•</span>
                      <div className="flex-1">
                        <p className="text-amber-200/90">{warning.message}</p>
                        {warning.code && (
                          <p className="mt-0.5 font-mono text-[10px] text-amber-300/60">
                            {warning.code}
                          </p>
                        )}
                        {warning.nodeId && (
                          <p className="mt-0.5 text-[10px] text-amber-300/50">
                            Node: {warning.nodeId}
                            {warning.field && ` • Field: ${warning.field}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      {info.length > 0 && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10">
          <button
            onClick={() => toggleSection("info")}
            className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-blue-500/5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <Info className="h-4 w-4" />
              <span>Suggestions ({info.length}) - Optimization tips</span>
            </div>
            {expandedSections.info
              ? <ChevronUp className="h-3.5 w-3.5 text-blue-300" />
              : <ChevronDown className="h-3.5 w-3.5 text-blue-300" />}
          </button>

          {expandedSections.info && (
            <div className="border-t border-blue-500/20 px-3 pb-2 pt-1">
              <ul className="space-y-2">
                {info.map((item, idx) => (
                  <li key={idx} className="text-xs">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-400">•</span>
                      <div className="flex-1">
                        <p className="text-blue-200/90">{item.message}</p>
                        {item.code && (
                          <p className="mt-0.5 font-mono text-[10px] text-blue-300/60">
                            {item.code}
                          </p>
                        )}
                        {item.nodeId && (
                          <p className="mt-0.5 text-[10px] text-blue-300/50">
                            Node: {item.nodeId}
                            {item.field && ` • Field: ${item.field}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
