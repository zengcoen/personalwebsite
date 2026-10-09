import type { IncomeShape, Scenario } from "@/lib/types";

// Self-employment income curves. Every shape moves from the floor (starting income) toward the ceiling
// (max target income) over the horizon. Values are annualised rates, so a month's `y` is "income per year".

// The horizon is entered in years; the curve math works in months.
export const MIN_HORIZON_YEARS = 1;
export const MAX_HORIZON_YEARS = 60;
export const MAX_HORIZON_MONTHS = MAX_HORIZON_YEARS * 12;

export type IncomeCurveInputs = Pick<
  Scenario,
  | "selfIncome"
  | "selfCeiling"
  | "selfHorizonYears"
  | "selfShape"
  | "sInflectionYears"
  | "sSteepness"
  | "stepEveryMonths"
  | "stepMagnitude"
>;

export type IncomePoint = { x: number; y: number };

export const INCOME_SHAPES: { value: IncomeShape; label: string }[] = [
  { value: "s-curve", label: "S-Curve" },
  { value: "stepwise", label: "Stepwise" },
];

export function isIncomeShape(value: unknown): value is IncomeShape {
  return value === "s-curve" || value === "stepwise";
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

// Whole-year horizon, clamped to the allowed range, converted to months.
export function horizonMonths(years: number): number {
  return clamp(Math.round(years), MIN_HORIZON_YEARS, MAX_HORIZON_YEARS) * 12;
}

// Logistic growth, normalised so month 0 = floor and month `horizon` = ceiling.
// Steepness is relative to the horizon, so 5 gives the same visual sharpness whatever the horizon length.
function sCurveProgress(month: number, horizon: number, inflection: number, steepness: number): number {
  const k = (Math.max(steepness, 0.01) * 10) / horizon;
  const logistic = (m: number) => 1 / (1 + Math.exp(-k * (m - inflection)));
  const low = logistic(0);
  const high = logistic(horizon);
  const span = high - low;
  if (span <= 1e-9) return clamp(month / horizon, 0, 1);
  return clamp((logistic(clamp(month, 0, horizon)) - low) / span, 0, 1);
}

// Flat between jumps, then an instantaneous step up every `every` months, capped at the ceiling.
function stepwiseIncome(inputs: IncomeCurveInputs, month: number, horizon: number): number {
  const every = Math.max(1, Math.round(inputs.stepEveryMonths));
  const jumps = Math.floor(clamp(month, 0, horizon) / every);
  const value = inputs.selfIncome + jumps * Math.max(inputs.stepMagnitude, 0);
  return Math.min(value, Math.max(inputs.selfCeiling, inputs.selfIncome));
}

export function incomeAtMonth(inputs: IncomeCurveInputs, month: number): number {
  const horizon = horizonMonths(inputs.selfHorizonYears);
  switch (inputs.selfShape) {
    case "stepwise":
      return stepwiseIncome(inputs, month, horizon);
    case "s-curve": {
      // The inflection point can never fall after the horizon.
      const inflection = clamp(inputs.sInflectionYears * 12, 0, horizon);
      const progress = sCurveProgress(month, horizon, inflection, inputs.sSteepness);
      return inputs.selfIncome + (inputs.selfCeiling - inputs.selfIncome) * progress;
    }
  }
}

// Monthly coordinate array for the chart: x = month index, y = annualised income in that month.
export function monthlyIncomeCurve(inputs: IncomeCurveInputs, months = horizonMonths(inputs.selfHorizonYears)): IncomePoint[] {
  return Array.from({ length: Math.max(0, months) + 1 }, (_, month) => ({
    x: month,
    y: incomeAtMonth(inputs, month),
  }));
}

// Annual self-employment income for each projection year: the average of its 12 monthly annualised rates.
export function annualSelfIncome(inputs: IncomeCurveInputs, years: number): number[] {
  return Array.from({ length: years }, (_, year) => {
    let total = 0;
    for (let m = 0; m < 12; m++) total += incomeAtMonth(inputs, year * 12 + m);
    return total / 12;
  });
}
