"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { inputBase } from "@/components/ui/styles";

type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  info?: string;
  hideLabel?: boolean;
};

const displayFormatter = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });

export function NumberField({ id, label, value, onChange, prefix, suffix, info, hideLabel }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const padding = prefix ? "pl-7 pr-3" : suffix ? "pl-3 pr-8" : "px-3";

  return (
    <Field id={id} label={label} info={info} hideLabel={hideLabel}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500 dark:text-slate-300">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={draft ?? displayFormatter.format(value)}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const parsed = parseFloat(raw.replace(/,/g, ""));
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          onFocus={(event) => event.target.select()}
          onBlur={() => setDraft(null)}
          className={`${inputBase} ${padding}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 dark:text-slate-300">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}
