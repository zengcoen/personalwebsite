"use client";

import { ResultsSummary } from "@/components/calculator/ResultsSummary";
import { ScenarioHeader } from "@/components/calculator/ScenarioHeader";
import { ScenarioInputs } from "@/components/calculator/ScenarioInputs";
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

// Mobile layout: one self-contained card per scenario, scrolled horizontally.
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
      className={`flex w-[min(88vw,400px)] shrink-0 snap-start flex-col rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 animate-column-in dark:bg-slate-900 ${
        isLeaving ? "pointer-events-none scale-95 opacity-0" : ""
      }`}
      style={{ borderColor: color }}
    >
      <ScenarioHeader
        scenario={scenario}
        color={color}
        canDelete={canDelete}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onReset={onReset}
        onDelete={onDelete}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-4">
        <ResultsSummary result={result} settings={settings} color={color} isFastest={isFastest} />
        <hr className="border-slate-200 dark:border-slate-700" />
        <ScenarioInputs scenario={scenario} onUpdate={onUpdate} />
      </div>
    </article>
  );
}
