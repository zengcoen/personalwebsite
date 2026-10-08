import { createScenario, createSettings } from "@/lib/defaults";
import type { PlannerState, Scenario, Settings } from "@/lib/types";

const STORAGE_KEY = "net-worth-goal-calculator:v1";

const NUMERIC_SCENARIO_KEYS = [
  "currentNetWorth",
  "jobIncome",
  "jobGrowth",
  "selfIncome",
  "selfGrowth",
  "selfExpenses",
  "monthlyInvestment",
  "investmentReturn",
  "livingExpensesMonthly",
] as const;

type Dict = Record<string, unknown>;

function isRecord(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeSettings(value: unknown): Settings {
  const base = createSettings();
  if (!isRecord(value)) return base;
  return {
    goal: toNumber(value.goal, base.goal),
    startYear: toNumber(value.startYear, base.startYear),
    currentAge: typeof value.currentAge === "number" && Number.isFinite(value.currentAge) ? value.currentAge : null,
    inflationOn: value.inflationOn === true,
    inflationRate: toNumber(value.inflationRate, base.inflationRate),
  };
}

function sanitizeScenario(value: Dict): Scenario {
  const base = createScenario();
  const scenario: Scenario = {
    ...base,
    id: typeof value.id === "string" && value.id.length > 0 ? value.id : base.id,
    title: typeof value.title === "string" ? value.title : base.title,
    colorIndex: toNumber(value.colorIndex, 0),
    province: value.province === "ON" ? "ON" : "BC",
    quitDate: typeof value.quitDate === "string" ? value.quitDate : "",
  };
  for (const key of NUMERIC_SCENARIO_KEYS) {
    scenario[key] = toNumber(value[key], base[key]);
  }
  return scenario;
}

export function loadPlannerState(): PlannerState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.scenarios)) return null;
    const scenarios = parsed.scenarios.filter(isRecord).map(sanitizeScenario);
    if (scenarios.length === 0) return null;
    return { settings: sanitizeSettings(parsed.settings), scenarios };
  } catch {
    return null;
  }
}

export function savePlannerState(state: PlannerState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
