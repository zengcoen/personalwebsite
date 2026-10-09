"use client";

import type { CSSProperties } from "react";
import { Field } from "@/components/ui/Field";
import { formatPercent } from "@/lib/format";

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  info?: string;
  hideLabel?: boolean;
  format?: (value: number) => string;
};

export function SliderField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  info,
  hideLabel,
  format = formatPercent,
}: SliderFieldProps) {
  const display = format(value);
  // Share of the track that is filled, drawn by the CSS in globals.css (`.range-input`).
  const percent = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const style = { "--pct": `${percent}%` } as CSSProperties;

  return (
    <Field id={id} label={label} info={info} hideLabel={hideLabel}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={display}
          className="range-input"
          style={style}
        />
        <output
          htmlFor={id}
          className="min-w-[4.5rem] shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900 dark:bg-slate-800 dark:text-slate-100"
        >
          {display}
        </output>
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </Field>
  );
}
