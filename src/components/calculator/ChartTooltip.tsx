"use client";

import type { TooltipContentProps } from "recharts";
import { formatCurrency, formatYears } from "@/lib/format";
import { scenarioColor } from "@/lib/defaults";
import type { Scenario, ScenarioResult } from "@/lib/types";

type Props = Pick<TooltipContentProps, "active" | "label"> & {
  scenarios: Scenario[];
  results: Record<string, ScenarioResult>;
  startYear: number;
};

function remainingLabel(yearsToGoal: number | null, index: number): string {
  if (yearsToGoal === null) return "Goal not reached in 60 years";
  if (index >= yearsToGoal) return "Goal reached";
  return `${formatYears(yearsToGoal - index)} to goal`;
}

export function ChartTooltip({ active, label, scenarios, results, startYear }: Props) {
  if (!active || typeof label !== "number") return null;
  const index = label - startYear;

  return (
    <div className="min-w-56 rounded-xl border border-slate-200 bg-white/95 p-3 text-sm shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {label}
        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
          {index === 0 ? "Today" : `Year ${index}`}
        </span>
      </p>
      <ul className="mt-2 space-y-2">
        {scenarios.map((scenario) => {
          const result = results[scenario.id];
          const point = result.points[index];
          return (
            <li key={scenario.id} className="space-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: scenarioColor(scenario) }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300">{scenario.title}</span>
                </span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(point.netWorth)}
                </span>
              </div>
              <p className="pl-[18px] text-xs text-slate-500 dark:text-slate-400">
                {remainingLabel(result.yearsToGoal, index)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
