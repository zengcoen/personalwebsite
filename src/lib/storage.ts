import { createScenario, createSettings } from "@/lib/defaults";
import { isIncomeShape } from "@/lib/selfIncome";
import { parseIsoDate } from "@/lib/projection";
import type { PlannerState, Scenario, Settings } from "@/lib/types";

// Bumped when the default scenarios changed so new defaults show up. Older v1 data is left in localStorage, not deleted.
const STORAGE_KEY = "net-worth-goal-calculator:v2";

const NUMERIC_SCENARIO_KEYS = [
  "currentNetWorth",
  "jobIncome",
  "jobGrowth",
  "selfIncome",
  "selfCeiling",
  "selfHorizonYears",
  "sInflectionYears",
  "sSteepness",
  "stepEveryMonths",
  "stepMagnitude",
  "selfExpenses",
  "investmentPercent",
  "investmentReturn",
  "livingExpensesMonthly",
  "postQuitLivingMonthly",
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
  // Older saves stored only a start year. The old default was the current year, so that now means today's date.
  // Any other saved year becomes January 1 of that year.
  const legacyYear = typeof value.startYear === "number" && Number.isInteger(value.startYear) ? value.startYear : null;
  const startDate =
    typeof value.startDate === "string" && parseIsoDate(value.startDate) !== null
      ? value.startDate
      : legacyYear === null
        ? base.startDate
        : legacyYear === new Date().getFullYear()
          ? base.startDate
          : `${legacyYear}-01-01`;
  return {
    goal: toNumber(value.goal, base.goal),
    startDate,
    currentAge: typeof value.currentAge === "number" && Number.isFinite(value.currentAge) ? value.currentAge : null,
    inflationOn: value.inflationOn === true,
    inflationRate: toNumber(value.inflationRate, base.inflationRate),
    chartYears: Math.min(60, Math.max(0, Math.round(toNumber(value.chartYears, base.chartYears)))),
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
    selfShape: isIncomeShape(value.selfShape) ? value.selfShape : base.selfShape,
  };
  for (const key of NUMERIC_SCENARIO_KEYS) {
    scenario[key] = toNumber(value[key], base[key]);
  }
  // Older saves stored the horizon in months. Convert it to whole years.
  if (typeof value.selfHorizonYears !== "number" && typeof value.selfHorizonMonths === "number") {
    scenario.selfHorizonYears = Math.round(value.selfHorizonMonths / 12);
  }
  // Older saves stored the inflection point in months.
  if (typeof value.sInflectionYears !== "number" && typeof value.sInflectionMonth === "number") {
    scenario.sInflectionYears = Math.round(value.sInflectionMonth / 12);
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
