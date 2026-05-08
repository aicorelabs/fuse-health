"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ScopeRef } from "@/lib/editor/templateScope";

export interface TemplateScopeContextValue {
  scope: readonly ScopeRef[];
  samples: Record<string, unknown> | null;
}

const Ctx = createContext<TemplateScopeContextValue>({
  scope: [],
  samples: null,
});

export function TemplateScopeProvider({
  value,
  children,
}: {
  value: TemplateScopeContextValue;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTemplateScope(): TemplateScopeContextValue {
  return useContext(Ctx);
}
