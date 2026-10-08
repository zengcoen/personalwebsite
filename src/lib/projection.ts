import { calculateTax } from "@/lib/tax";
import type {
  JobEnd,
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

type QuitDate = {
  year: number;
  month: number;
  day: number;
};

export function parseQuitDate(value: string): QuitDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function employedFraction(quit: QuitDate | null, year: number): number {
  if (!quit || year < quit.year) return 1;
  if (year > quit.year) return 0;
  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year + 1, 0, 1);
  const quitMoment = Date.UTC(year, quit.month - 1, quit.day);
  return Math.min(1, Math.max(0, (quitMoment - yearStart) / (yearEnd - yearStart)));
}

function breakdownFor(
  scenario: Scenario,
  quit: QuitDate | null,
  year: number,
  step: number,
  inflation: number,
): YearBreakdown {
  const priceLevel = Math.pow(1 + inflation, step);
  const jobGross =
    scenario.jobIncome * Math.pow(1 + scenario.jobGrowth / 100, step) * employedFraction(quit, year);
  const selfGross = scenario.selfIncome * Math.pow(1 + scenario.selfGrowth / 100, step);
  const selfExpenses = scenario.selfExpenses * priceLevel;
  const livingExpenses = scenario.livingExpensesMonthly * 12 * priceLevel;
  const investmentContributions = scenario.monthlyInvestment * 12;
  const taxableIncome = jobGross + Math.max(0, selfGross - selfExpenses);
  const tax = calculateTax(taxableIncome, scenario.province);
  const grossIncome = jobGross + selfGross;
  const afterTaxIncome = grossIncome - selfExpenses - tax.total;
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

export function projectScenario(scenario: Scenario, settings: Settings): ScenarioResult {
  const quit = parseQuitDate(scenario.quitDate);
  const inflation = settings.inflationOn ? settings.inflationRate / 100 : 0;
  const monthlyReturn = Math.pow(1 + scenario.investmentReturn / 100, 1 / 12) - 1;

  const breakdowns = Array.from({ length: HORIZON_YEARS }, (_, step) =>
    breakdownFor(scenario, quit, settings.startYear + step, step, inflation),
  );

  let portfolio = scenario.currentNetWorth;
  let cash = 0;
  let principal = scenario.currentNetWorth;
  const nominal = [{ portfolio, cash, principal }];

  for (const breakdown of breakdowns) {
    for (let month = 0; month < 12; month++) {
      portfolio = portfolio * (1 + monthlyReturn) + scenario.monthlyInvestment;
    }
    cash += breakdown.annualSurplus;
    principal += breakdown.investmentContributions;
    nominal.push({ portfolio, cash, principal });
  }

  const points: ProjectionPoint[] = nominal.map((row, index) => {
    const deflator = Math.pow(1 + inflation, index);
    return {
      index,
      year: settings.startYear + index,
      netWorth: (row.portfolio + row.cash) / deflator,
      portfolio: row.portfolio / deflator,
      cash: row.cash / deflator,
      principal: row.principal / deflator,
    };
  });

  const reached = points.find((point) => point.netWorth >= settings.goal);
  const yearsToGoal = reached ? reached.index : null;
  const goalYear = reached ? reached.year : null;

  const jobEnd: JobEnd | null = quit
    ? {
        date: scenario.quitDate,
        year: quit.year,
        chartX: quit.year + employedFraction(quit, quit.year),
        endedBeforeStart: quit.year < settings.startYear,
      }
    : null;

  return {
    points,
    yearsToGoal,
    goalYear,
    milestones: MILESTONE_YEARS.map((years) => ({ years, point: points[years] })),
    decisionIndex: yearsToGoal ?? DECISION_FALLBACK_YEARS,
    yearOne: breakdowns[0],
    jobEnd,
  };
}

export function chartHorizon(results: ScenarioResult[]): number {
  if (results.some((result) => result.yearsToGoal === null)) return HORIZON_YEARS;
  const latest = Math.max(0, ...results.map((result) => result.yearsToGoal ?? 0));
  return Math.min(HORIZON_YEARS, Math.max(MIN_CHART_YEARS, latest + CHART_PADDING_YEARS));
}

export function fastestScenarioIds(results: Record<string, ScenarioResult>): string[] {
  const reachable = Object.entries(results).filter(([, result]) => result.yearsToGoal !== null);
  if (reachable.length === 0) return [];
  const best = Math.min(...reachable.map(([, result]) => result.yearsToGoal ?? Infinity));
  return reachable.filter(([, result]) => result.yearsToGoal === best).map(([id]) => id);
}
