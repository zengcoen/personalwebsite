"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_INPUTS, createInitialState, createScenario, makeId, pickColorIndex } from "@/lib/defaults";
import { loadPlannerState, savePlannerState } from "@/lib/storage";
import type { PlannerState, Scenario, Settings } from "@/lib/types";

let cached: PlannerState | null = null;
const listeners = new Set<() => void>();

function getState(): PlannerState {
  if (cached === null) cached = loadPlannerState() ?? createInitialState();
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commitState(next: PlannerState) {
  cached = next;
  savePlannerState(next);
  listeners.forEach((listener) => listener());
}

function update(transform: (previous: PlannerState) => PlannerState) {
  commitState(transform(getState()));
}

export function useNetWorthPlanner() {
  const state = useSyncExternalStore(subscribe, getState, () => null);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      update((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } })),
    [],
  );

  const updateScenario = useCallback(
    (id: string, patch: Partial<Scenario>) =>
      update((previous) => ({
        ...previous,
        scenarios: previous.scenarios.map((scenario) =>
          scenario.id === id ? { ...scenario, ...patch } : scenario,
        ),
      })),
    [],
  );

  const addScenario = useCallback(
    () =>
      update((previous) => ({
        ...previous,
        scenarios: [
          ...previous.scenarios,
          createScenario({
            title: `Scenario ${previous.scenarios.length + 1}`,
            colorIndex: pickColorIndex(previous.scenarios),
          }),
        ],
      })),
    [],
  );

  const duplicateScenario = useCallback(
    (id: string) =>
      update((previous) => {
        const index = previous.scenarios.findIndex((scenario) => scenario.id === id);
        if (index === -1) return previous;
        const source = previous.scenarios[index];
        const copy: Scenario = {
          ...source,
          id: makeId(),
          title: `${source.title} (copy)`,
          colorIndex: pickColorIndex(previous.scenarios),
        };
        return {
          ...previous,
          scenarios: [...previous.scenarios.slice(0, index + 1), copy, ...previous.scenarios.slice(index + 1)],
        };
      }),
    [],
  );

  const deleteScenario = useCallback(
    (id: string) =>
      update((previous) =>
        previous.scenarios.length <= 1
          ? previous
          : { ...previous, scenarios: previous.scenarios.filter((scenario) => scenario.id !== id) },
      ),
    [],
  );

  const resetScenario = useCallback(
    (id: string) =>
      update((previous) => ({
        ...previous,
        scenarios: previous.scenarios.map((scenario) =>
          scenario.id === id ? { ...scenario, ...DEFAULT_INPUTS } : scenario,
        ),
      })),
    [],
  );

  return {
    state,
    updateSettings,
    updateScenario,
    addScenario,
    duplicateScenario,
    deleteScenario,
    resetScenario,
  };
}
