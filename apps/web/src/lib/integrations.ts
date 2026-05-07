"use client";

import { useEffect, useState } from "react";

export interface IntegrationFunctionListing {
  name: string;
  description: string;
  timeoutMs: number;
  sampleInput?: unknown;
  sampleOutput?: unknown;
}

export interface IntegrationListing {
  name: string;
  label: string;
  description: string;
  category: string;
  functions: IntegrationFunctionListing[];
}

let cache: IntegrationListing[] | null = null;
let inflight: Promise<IntegrationListing[]> | null = null;
const subscribers = new Set<(l: IntegrationListing[]) => void>();

async function fetchOnce(): Promise<IntegrationListing[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch("/api/integrations", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { integrations: IntegrationListing[] };
    cache = body.integrations;
    subscribers.forEach((cb) => cb(cache!));
    return body.integrations;
  })();
  return inflight;
}

export interface IntegrationsState {
  data: IntegrationListing[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe to the shared integrations registry. First call fetches; subsequent
 * components share the same cached listing.
 */
export function useIntegrations(): IntegrationsState {
  const [data, setData] = useState<IntegrationListing[] | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let cancelled = false;
    const onUpdate = (l: IntegrationListing[]) => {
      if (!cancelled) setData(l);
    };
    subscribers.add(onUpdate);

    if (cache) {
      setLoading(false);
    } else {
      fetchOnce()
        .then((l) => {
          if (!cancelled) {
            setData(l);
            setLoading(false);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
      subscribers.delete(onUpdate);
    };
  }, []);

  return { data, loading, error };
}

export function findFunction(
  listing: IntegrationListing[] | null,
  integrationName: string,
  functionName: string,
): { integration: IntegrationListing; fn: IntegrationFunctionListing } | null {
  if (!listing) return null;
  const integration = listing.find((i) => i.name === integrationName);
  if (!integration) return null;
  const fn = integration.functions.find((f) => f.name === functionName);
  if (!fn) return null;
  return { integration, fn };
}
