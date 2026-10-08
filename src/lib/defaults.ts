import type { PlannerState, Scenario, ScenarioInputs, Settings } from "@/lib/types";

export const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#0ea5e9",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

export const DEFAULT_INPUTS: ScenarioInputs = {
  province: "BC",
  currentNetWorth: 150000,
  jobIncome: 110000,
  jobGrowth: 3,
  quitDate: "",
  selfIncome: 0,
  selfGrowth: 0,
  selfExpenses: 0,
  monthlyInvestment: 2000,
  investmentReturn: 7,
  livingExpensesMonthly: 4000,
};

export function makeId(): string {
  return `s${Math.random().toString(36).slice(2, 10)}`;
}

export function scenarioColor(scenario: Pick<Scenario, "colorIndex">): string {
  return PALETTE[((scenario.colorIndex % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

export function pickColorIndex(scenarios: Scenario[]): number {
  const used = new Set(scenarios.map((scenario) => scenario.colorIndex));
  const free = PALETTE.findIndex((_, index) => !used.has(index));
  return free === -1 ? scenarios.length % PALETTE.length : free;
}

export function createSettings(): Settings {
  return {
    goal: 1000000,
    startYear: new Date().getFullYear(),
    currentAge: null,
    inflationOn: false,
    inflationRate: 2,
  };
}

export function createScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    ...DEFAULT_INPUTS,
    id: makeId(),
    title: "Stay at Job",
    colorIndex: 0,
    ...overrides,
  };
}

export function createInitialState(): PlannerState {
  return {
    settings: createSettings(),
    scenarios: [createScenario()],
  };
}
