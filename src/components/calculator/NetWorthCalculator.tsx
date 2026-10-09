"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChartHoverProvider } from "@/components/calculator/ChartHoverContext";
import { ScenarioColumn } from "@/components/calculator/ScenarioColumn";
import { ScenarioGrid } from "@/components/calculator/ScenarioGrid";
import { SettingsPanel } from "@/components/calculator/SettingsPanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNetWorthPlanner } from "@/hooks/useNetWorthPlanner";
import { formatCurrency, formatElapsedYears, formatQuitDate } from "@/lib/format";
import { buildCsv, buildText, downloadFile } from "@/lib/export";
import { fastestScenarioIds, projectScenario } from "@/lib/projection";
import type { ScenarioResult } from "@/lib/types";

const REMOVE_ANIMATION_MS = 220;

export function NetWorthCalculator() {
  const { state, updateSettings, updateScenario, addScenario, duplicateScenario, deleteScenario, resetScenario } =
    useNetWorthPlanner();
  const [leavingIds, setLeavingIds] = useState<string[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isWide = useMediaQuery("(min-width: 1280px)");

  const results = useMemo<Record<string, ScenarioResult>>(() => {
    if (!state) return {};
    return Object.fromEntries(
      state.scenarios.map((scenario) => [scenario.id, projectScenario(scenario, state.settings)] as const),
    );
  }, [state]);

  const fastest = useMemo(() => fastestScenarioIds(results), [results]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-300">
        Loading calculator…
      </div>
    );
  }

  const visibleCount = state.scenarios.length - leavingIds.length;
  const canDelete = visibleCount > 1;
  const fastestScenarios = state.scenarios.filter((scenario) => fastest.includes(scenario.id));
  const fastestResult = fastestScenarios.length > 0 ? results[fastestScenarios[0].id] : null;
  const fastestNames = fastestScenarios.map((scenario) => scenario.title).join(" & ");

  function handleAdd() {
    addScenario();
    window.setTimeout(() => {
      const scroller = scrollerRef.current;
      if (scroller) scroller.scrollTo({ left: scroller.scrollWidth, behavior: "smooth" });
    }, 80);
  }

  function handleDelete(id: string) {
    if (!canDelete || leavingIds.includes(id)) return;
    setLeavingIds((ids) => [...ids, id]);
    window.setTimeout(() => {
      deleteScenario(id);
      setLeavingIds((ids) => ids.filter((existing) => existing !== id));
    }, REMOVE_ANIMATION_MS);
  }

  function handleExport(format: "csv" | "text") {
    if (!state) return;
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      downloadFile(buildCsv(state, results), `net-worth-scenarios-${stamp}.csv`, "text/csv;charset=utf-8");
    } else {
      downloadFile(buildText(state, results), `net-worth-scenarios-${stamp}.txt`, "text/plain;charset=utf-8");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">Net Worth Goal Calculator – Canada</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              Home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6">
        <section
          aria-label="About this tool"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600 shadow-sm sm:px-5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <p>
            Estimate when your net worth could reach a target, and how decisions like quitting your job change that
            timeline. Each scenario projects your income, savings, investment returns, and spending year by year, with
            estimated BC or Ontario taxes. Compare scenarios side by side. These are simplified planning estimates, not
            financial advice.
          </p>
        </section>

        <div className="space-y-4">
          <div className="min-w-0 space-y-4">
            <SettingsPanel
              settings={state.settings}
              onChange={updateSettings}
              onAdd={handleAdd}
              onExport={handleExport}
            />

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900" role="status">
              {fastestResult === null ? (
                <span className="text-slate-600 dark:text-slate-300">
                  No scenario reaches {formatCurrency(state.settings.goal)} within 60 years yet.
                </span>
              ) : fastestResult.yearsToGoal === 0 ? (
                <span>
                  <strong>{fastestNames}</strong> already meets the {formatCurrency(state.settings.goal)} goal.
                </span>
              ) : (
                <span>
                  <strong>{fastestNames}</strong> reaches {formatCurrency(state.settings.goal)}
                  {state.scenarios.length > 1 ? " fastest" : ""}: in{" "}
                  <strong>{formatElapsedYears(fastestResult.yearsToGoal ?? 0)}</strong> (on{" "}
                  {formatQuitDate(fastestResult.goalDate ?? state.settings.startDate)}).
                </span>
              )}
            </div>

          </div>

          <section aria-label="Scenarios" className="min-w-0">
            <ChartHoverProvider>
            {isWide ? (
              <ScenarioGrid
                scrollerRef={scrollerRef}
                scenarios={state.scenarios}
                results={results}
                settings={state.settings}
                fastest={fastest}
                canDelete={canDelete}
                onUpdate={updateScenario}
                onDuplicate={duplicateScenario}
                onDelete={(id) => handleDelete(id)}
                onReset={resetScenario}
              />
            ) : (
              <div
                ref={scrollerRef}
                className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-4 pt-1"
              >
                {state.scenarios.map((scenario) => (
                  <ScenarioColumn
                    key={scenario.id}
                    scenario={scenario}
                    result={results[scenario.id]}
                    settings={state.settings}
                    isFastest={fastest.includes(scenario.id)}
                    isLeaving={leavingIds.includes(scenario.id)}
                    canDelete={canDelete}
                    onUpdate={(patch) => updateScenario(scenario.id, patch)}
                    onDuplicate={() => duplicateScenario(scenario.id)}
                    onDelete={() => handleDelete(scenario.id)}
                    onReset={() => resetScenario(scenario.id)}
                  />
                ))}
              </div>
            )}
            </ChartHoverProvider>
          </section>
        </div>

        <footer className="pb-8 text-center text-xs text-slate-500 dark:text-slate-300">
          This is a simplified educational tool. Actual taxes, investment returns, and expenses will vary. Consult a financial advisor.
        </footer>
      </main>
    </div>
  );
}
