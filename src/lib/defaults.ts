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
  selfCeiling: 0,
  selfHorizonYears: 10,
  selfShape: "s-curve",
  sInflectionYears: 5,
  sSteepness: 5,
  stepEveryMonths: 12,
  stepMagnitude: 5000,
  selfExpenses: 0,
  investmentPercent: 100,
  investmentReturn: 7,
  livingExpensesMonthly: 4000,
  postQuitLivingMonthly: 4000,
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

// Today's date in the local timezone, as YYYY-MM-DD.
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function createSettings(): Settings {
  return {
    goal: 1000000,
    startDate: todayIsoDate(),
    currentAge: null,
    inflationOn: false,
    inflationRate: 2,
    chartYears: 10,
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

export function createDefaultScenarios(): Scenario[] {
  return [
    createScenario({ title: "Stay at Job", colorIndex: 0 }),
    createScenario({
      title: "Quit Job in 2027",
      colorIndex: 1,
      quitDate: "2027-07-16",
      selfIncome: 0,
      selfCeiling: 600000,
      selfHorizonYears: 10,
    }),
  ];
}

export function createInitialState(): PlannerState {
  return {
    settings: createSettings(),
    scenarios: createDefaultScenarios(),
  };
}
