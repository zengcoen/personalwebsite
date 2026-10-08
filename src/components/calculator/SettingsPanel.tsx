"use client";

import { Field } from "@/components/ui/Field";
import { InfoTip } from "@/components/ui/InfoTip";
import { NumberField } from "@/components/ui/NumberField";
import { Toggle } from "@/components/ui/Toggle";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { Settings } from "@/lib/types";

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onAdd: () => void;
  onExport: (format: "csv" | "text") => void;
};

export function SettingsPanel({ settings, onChange, onAdd, onExport }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumberField
          id="goal"
          label="Net worth goal"
          prefix="$"
          value={settings.goal}
          onChange={(goal) => onChange({ goal })}
          info="One shared target for every scenario. Shown as the red dashed line on the chart."
        />
        <Field
          id="start-year"
          label="Start year"
          info="First projected calendar year. Drives the chart timeline and quit-date year."
        >
          <input
            id="start-year"
            type="number"
            min={1900}
            max={2200}
            value={settings.startYear}
            onChange={(event) => {
              const year = Number(event.target.value);
              if (Number.isInteger(year) && year >= 1900 && year <= 2200) onChange({ startYear: year });
            }}
            className={inputClass}
          />
        </Field>
        <Field
          id="current-age"
          label="Current age (optional)"
          info="If set, milestones and the goal date also show your age at that point."
        >
          <input
            id="current-age"
            type="number"
            min={0}
            max={120}
            placeholder="Optional"
            value={settings.currentAge ?? ""}
            onChange={(event) =>
              onChange({ currentAge: event.target.value === "" ? null : Number(event.target.value) })
            }
            className={inputClass}
          />
        </Field>
        {settings.inflationOn && (
          <NumberField
            id="inflation-rate"
            label="Inflation rate"
            suffix="%"
            value={settings.inflationRate}
            onChange={(inflationRate) => onChange({ inflationRate })}
            info="Living expenses and self-employment expenses rise with this rate each year. Results are deflated to today's dollars."
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Toggle
            label="Show results in today's dollars"
            checked={settings.inflationOn}
            onChange={(inflationOn) => onChange({ inflationOn })}
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Today&apos;s dollars</span>
          <InfoTip text="When on, projected values are deflated by inflation and expenses grow with inflation. Tax brackets are held at current values." label="Today's dollars" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAdd} className={primaryButton}>
            + Add scenario
          </button>
          <button type="button" onClick={() => onExport("csv")} className={secondaryButton}>
            Export CSV
          </button>
          <button type="button" onClick={() => onExport("text")} className={secondaryButton}>
            Export text
          </button>
        </div>
      </div>
    </section>
  );
}
