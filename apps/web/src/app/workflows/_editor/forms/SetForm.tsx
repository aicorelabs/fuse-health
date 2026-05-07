"use client";

import { FormField } from "./_FormField";
import { JsonField } from "./_JsonField";

interface Config {
  fields: Record<string, unknown>;
}

export function SetForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <FormField label="Fields (JSON)" hint="Templates resolve at run time. Output is this object.">
      <JsonField
        value={config.fields ?? {}}
        onChange={(fields) =>
          onChange({ fields: (fields ?? {}) as Record<string, unknown> })
        }
      />
    </FormField>
  );
}
