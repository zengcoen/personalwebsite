"use client";

import { ResultsSummary } from "@/components/calculator/ResultsSummary";
import { ScenarioInputs } from "@/components/calculator/ScenarioInputs";
import { secondaryButton } from "@/components/ui/styles";
import { scenarioColor } from "@/lib/defaults";
import type { Scenario, ScenarioResult, Settings } from "@/lib/types";

type Props = {
  scenario: Scenario;
  result: ScenarioResult;
  settings: Settings;
  isFastest: boolean;
  isLeaving: boolean;
  canDelete: boolean;
  onUpdate: (patch: Partial<Scenario>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReset: () => void;
};

export function ScenarioColumn({
  scenario,
  result,
  settings,
  isFastest,
  isLeaving,
  canDelete,
  onUpdate,
  onDuplicate,
  onDelete,
  onReset,
}: Props) {
  const color = scenarioColor(scenario);

  return (
    <article
      aria-label={scenario.title}
      className={`flex w-[min(88vw,400px)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 animate-column-in dark:bg-slate-900 ${
        isLeaving ? "pointer-events-none scale-95 opacity-0" : ""
      }`}
      style={{
        borderColor: color,
        boxShadow: isFastest ? `0 12px 32px -12px ${color}` : undefined,
      }}
    >
      <header className="space-y-2 p-4 pb-3" style={{ backgroundColor: `${color}12` }}>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <input
            aria-label="Scenario title"
            value={scenario.title}
            maxLength={60}
            onChange={(event) => onUpdate({ title: event.target.value })}
            onBlur={() => {
              if (!scenario.title.trim()) onUpdate({ title: "Untitled scenario" });
            }}
            className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-lg font-semibold outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500/30 dark:focus:bg-slate-900"
          />
        </div>
        <div className="flex gap-1.5 pl-5">
          <button type="button" onClick={onDuplicate} className={`${secondaryButton} px-2.5 py-1 text-xs`}>
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            className={`${secondaryButton} px-2.5 py-1 text-xs hover:text-rose-600 dark:hover:text-rose-400`}
          >
            Delete
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-4">
        <ResultsSummary result={result} settings={settings} color={color} isFastest={isFastest} />
        <hr className="border-slate-200 dark:border-slate-800" />
        <ScenarioInputs scenario={scenario} onUpdate={onUpdate} onReset={onReset} />
      </div>
    </article>
  );
}
