import { annualSelfIncome } from "@/lib/selfIncome";
import { calculateTax } from "@/lib/tax";
import type {
  JobEnd,
  Milestone,
  ProjectionPoint,
  Scenario,
  ScenarioResult,
  Settings,
  YearBreakdown,
} from "@/lib/types";

export const HORIZON_YEARS = 60;
export const MILESTONE_YEARS = [5, 10, 15, 20] as const;
const DECISION_FALLBACK_YEARS = 20;
const MIN_CHART_YEARS = 20;
const CHART_PADDING_YEARS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

// Parses a YYYY-MM-DD string. Returns null when the format or the calendar range is invalid.
export function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function utcMs(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function yearStartMs(year: number): number {
  return Date.UTC(year, 0, 1);
}

function yearLengthMs(year: number): number {
  return yearStartMs(year + 1) - yearStartMs(year);
}

export function employedFraction(quit: CalendarDate | null, year: number): number {
  if (!quit || year < quit.year) return 1;
  if (year > quit.year) return 0;
  const quitMoment = utcMs(quit);
  return Math.min(1, Math.max(0, (quitMoment - yearStartMs(year)) / yearLengthMs(year)));
}

// One projection period. Period 0 starts on the start date (partial year); later periods are full calendar years.
type Period = {
  year: number;
  step: number;
  startMs: number;
  endMs: number;
  // Length of the period in years.
  years: number;
};

function periodFor(year: number, step: number, startMs: number): Period {
  const begin = step === 0 ? startMs : yearStartMs(year);
  const end = yearStartMs(year + 1);
  return { year, step, startMs: begin, endMs: end, years: (end - begin) / yearLengthMs(year) };
}

// Years of job income in the period. Before the quit date the job pays; after it, it does not.
function employedYears(quit: CalendarDate | null, period: Period): number {
  if (!quit) return period.years;
  const employedMs = Math.min(Math.max(utcMs(quit) - period.startMs, 0), period.endMs - period.startMs);
  return employedMs / yearLengthMs(period.year);
}

function breakdownFor(
  scenario: Scenario,
  quit: CalendarDate | null,
  period: Period,
  inflation: number,
  selfAnnual: number,
): YearBreakdown {
  const length = period.years;
  const priceLevel = Math.pow(1 + inflation, period.step);
  const employed = employedYears(quit, period);
  const jobGross = scenario.jobIncome * Math.pow(1 + scenario.jobGrowth / 100, period.step) * employed;
  const selfGross = selfAnnual * length;
  const selfExpenses = scenario.selfExpenses * priceLevel * length;
  // Living costs use the regular amount while employed and the post-quit amount after that, all prorated to the period.
  const livingExpenses =
    (scenario.livingExpensesMonthly * employed + scenario.postQuitLivingMonthly * (length - employed)) * 12 * priceLevel;
  // Tax is worked out on the annualised income for the period, then scaled back to the period's length.
  const taxableIncome = jobGross + Math.max(0, selfGross - selfExpenses);
  const annualTax = calculateTax(taxableIncome / length, scenario.province);
  const tax = {
    federal: annualTax.federal * length,
    provincial: annualTax.provincial * length,
    total: annualTax.total * length,
  };
  const grossIncome = jobGross + selfGross;
  const afterTaxIncome = grossIncome - selfExpenses - tax.total;
  // Spare cash is what is left after tax, expenses and living costs. Negative spare cash invests nothing.
  const spareCash = Math.max(0, afterTaxIncome - livingExpenses);
  const share = Math.min(100, Math.max(0, scenario.investmentPercent)) / 100;
  const investmentContributions = spareCash * share;
  return {
    grossIncome,
    selfExpenses,
    taxableIncome,
    tax,
    afterTaxIncome,
    livingExpenses,
    investmentContributions,
    annualSurplus: afterTaxIncome - livingExpenses - investmentContributions,
  };
}

// Compounds monthly over `months` (may be fractional for the partial first year).
// Contributions are spread evenly across the months and added at each month end.
function growPortfolio(start: number, contributions: number, monthlyReturn: number, months: number): number {
  if (months <= 0 || monthlyReturn === 0) return start + contributions;
  const growth = Math.pow(1 + monthlyReturn, months);
  const perMonth = contributions / months;
  return start * growth + perMonth * ((growth - 1) / monthlyReturn);
}

// Linear interpolation between two projection points, used for exact goal dates and milestones.
function blendPoints(a: ProjectionPoint, b: ProjectionPoint, t: number): ProjectionPoint {
  const mix = (x: number, y: number) => x + (y - x) * t;
  const decimalYear = mix(a.decimalYear, b.decimalYear);
  return {
    index: b.index,
    year: Math.floor(decimalYear),
    decimalYear,
    elapsedYears: mix(a.elapsedYears, b.elapsedYears),
    netWorth: mix(a.netWorth, b.netWorth),
    portfolio: mix(a.portfolio, b.portfolio),
    cash: mix(a.cash, b.cash),
    principal: mix(a.principal, b.principal),
  };
}

// First point at or after `years` elapsed, interpolated. Past the end, returns the last point.
function pointAtElapsed(points: ProjectionPoint[], years: number): ProjectionPoint {
  if (years <= 0) return points[0];
  const k = points.findIndex((point) => point.elapsedYears >= years);
  if (k === -1) return points[points.length - 1];
  const a = points[k - 1];
  const b = points[k];
  return blendPoints(a, b, (years - a.elapsedYears) / (b.elapsedYears - a.elapsedYears));
}

// First moment net worth reaches the goal. `index` is the first point at or above the goal.
function goalCrossing(points: ProjectionPoint[], goal: number): { point: ProjectionPoint; index: number } | null {
  if (points[0].netWorth >= goal) return { point: points[0], index: 0 };
  const k = points.findIndex((point) => point.netWorth >= goal);
  if (k === -1) return null;
  const a = points[k - 1];
  const b = points[k];
  const t = (goal - a.netWorth) / (b.netWorth - a.netWorth);
  return { point: blendPoints(a, b, t), index: k };
}

// Converts a decimal calendar year to a YYYY-MM-DD date, rounded to the nearest day.
function dateFromDecimalYear(decimalYear: number): string {
  const year = Math.floor(decimalYear);
  const ms = yearStartMs(year) + (decimalYear - year) * yearLengthMs(year);
  return new Date(Math.round(ms / DAY_MS) * DAY_MS).toISOString().slice(0, 10);
}

export function projectScenario(scenario: Scenario, settings: Settings): ScenarioResult {
  const start = parseIsoDate(settings.startDate) ?? { year: new Date().getUTCFullYear(), month: 1, day: 1 };
  const startMs = utcMs(start);
  const quit = parseIsoDate(scenario.quitDate);
  const inflation = settings.inflationOn ? settings.inflationRate / 100 : 0;
  const monthlyReturn = Math.pow(1 + scenario.investmentReturn / 100, 1 / 12) - 1;

  const selfByYear = annualSelfIncome(scenario, HORIZON_YEARS);
  const periods = Array.from({ length: HORIZON_YEARS }, (_, step) => periodFor(start.year + step, step, startMs));
  const breakdowns = periods.map((period) => breakdownFor(scenario, quit, period, inflation, selfByYear[period.step]));

  let portfolio = scenario.currentNetWorth;
  let cash = 0;
  let principal = scenario.currentNetWorth;
  const nominal = [{ portfolio, cash, principal }];

  periods.forEach((period, index) => {
    const breakdown = breakdowns[index];
    portfolio = growPortfolio(portfolio, breakdown.investmentContributions, monthlyReturn, 12 * period.years);
    cash += breakdown.annualSurplus;
    principal += breakdown.investmentContributions;
    nominal.push({ portfolio, cash, principal });
  });

  // Point k is at January 1 of year start+k. Point 0 is the start date itself.
  const startFraction = (startMs - yearStartMs(start.year)) / yearLengthMs(start.year);
  const stubYears = periods[0].years;
  const decimalAt = (index: number) => (index === 0 ? start.year + startFraction : start.year + index);
  const elapsedAt = (index: number) => (index === 0 ? 0 : stubYears + index - 1);

  const points: ProjectionPoint[] = nominal.map((row, index) => {
    const deflator = Math.pow(1 + inflation, elapsedAt(index));
    return {
      index,
      year: Math.floor(decimalAt(index)),
      decimalYear: decimalAt(index),
      elapsedYears: elapsedAt(index),
      netWorth: (row.portfolio + row.cash) / deflator,
      portfolio: row.portfolio / deflator,
      cash: row.cash / deflator,
      principal: row.principal / deflator,
    };
  });

  const crossing = goalCrossing(points, settings.goal);
  const yearsToGoal = crossing ? crossing.point.elapsedYears : null;
  const goalDate = crossing ? (crossing.index === 0 ? settings.startDate : dateFromDecimalYear(crossing.point.decimalYear)) : null;

  const jobEnd: JobEnd | null = quit
    ? {
        date: scenario.quitDate,
        year: quit.year,
        chartX: quit.year + employedFraction(quit, quit.year),
        endedBeforeStart: utcMs(quit) < startMs,
      }
    : null;

  // Full calendar year for the start year, so the income breakdown shows annual figures.
  const yearOne = breakdownFor(
    scenario,
    quit,
    periodFor(start.year, 0, yearStartMs(start.year)),
    inflation,
    selfByYear[0],
  );

  const milestones: Milestone[] = MILESTONE_YEARS.map((years) => ({ years, point: pointAtElapsed(points, years) }));

  return {
    points,
    yearsToGoal,
    goalDate,
    milestones,
    decisionIndex: crossing ? crossing.index : DECISION_FALLBACK_YEARS,
    yearOne,
    jobEnd,
  };
}

// Points drawn on a net worth chart. Auto (chartYears 0) fits the goal date. Otherwise the chart ends
// exactly at the chosen number of years, with an interpolated final point.
export function chartSeries(result: ScenarioResult, chartYears: number): { points: ProjectionPoint[]; endYears: number } {
  if (chartYears <= 0) {
    const points = result.points.slice(0, scenarioHorizon(result) + 1);
    return { points, endYears: points[points.length - 1].elapsedYears };
  }
  const endYears = Math.min(HORIZON_YEARS, chartYears);
  const inside = result.points.filter((point) => point.elapsedYears < endYears);
  return { points: [...inside, pointAtElapsed(result.points, endYears)], endYears };
}

export function scenarioHorizon(result: ScenarioResult): number {
  if (result.yearsToGoal === null) return HORIZON_YEARS;
  return Math.min(HORIZON_YEARS, Math.max(MIN_CHART_YEARS, Math.ceil(result.yearsToGoal) + CHART_PADDING_YEARS));
}

export function fastestScenarioIds(results: Record<string, ScenarioResult>): string[] {
  const reachable = Object.entries(results).filter(([, result]) => result.yearsToGoal !== null);
  if (reachable.length === 0) return [];
  const best = Math.min(...reachable.map(([, result]) => result.yearsToGoal ?? Infinity));
  return reachable.filter(([, result]) => result.yearsToGoal === best).map(([id]) => id);
}
