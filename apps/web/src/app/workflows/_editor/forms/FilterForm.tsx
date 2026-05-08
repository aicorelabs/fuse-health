"use client";

import type { Condition } from "@fuse/core";

import { ConditionField } from "./_ConditionField";

interface Config {
  condition: Condition;
}

export function FilterForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <ConditionField
        value={config.condition}
        onChange={(condition) => onChange({ condition })}
      />
      <p className="text-xs text-neutral-500">
        Truthy → downstream runs. Falsy → downstream is skipped.
      </p>
    </div>
  );
}
