"use client";

import type { ReactNode } from "react";
import { NetWorthLineChart } from "@/components/calculator/NetWorthLineChart";
import { formatCurrency, formatElapsedYears, formatQuitDate } from "@/lib/format";
import type { ScenarioResult, Settings } from "@/lib/types";

type Props = {
  result: ScenarioResult;
  settings: Settings;
  color: string;
  isFastest: boolean;
};

function StatRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="text-sm text-slate-600 dark:text-slate-300">{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-base font-bold text-slate-900 dark:text-white" : "text-sm font-medium text-slate-800 dark:text-slate-200"}`}>
        {value}
      </dd>
    </div>
  );
}

function deduction(value: number): string {
  return value > 0 ? `-${formatCurrency(value)}` : formatCurrency(0);
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400">{children}</h4>;
}

export function ResultsSummary({ result, settings, color, isFastest }: Props) {
  const { points, yearsToGoal, goalDate, yearOne, jobEnd } = result;
  // Age at an elapsed time in years from the start date, shown as a whole number.
  const ageSuffix = (yearsFromStart: number) => {
    const age = settings.currentAge === null ? null : settings.currentAge + Math.round(yearsFromStart);
    return age === null ? "" : ` (age ${age})`;
  };

  let headlineValue: string;
  let headlineSub: string;
  if (yearsToGoal === null) {
    headlineValue = "Not reached";
    headlineSub = "Goal is not reached within 60 years with these inputs.";
  } else if (yearsToGoal === 0) {
    headlineValue = "Now";
    headlineSub = "Current net worth already meets the goal.";
  } else {
    headlineValue = formatElapsedYears(yearsToGoal);
    headlineSub = `Goal reached on ${formatQuitDate(goalDate ?? settings.startDate)}${ageSuffix(yearsToGoal)}`;
  }

  const taxRate = yearOne.grossIncome > 0 ? (yearOne.tax.total / yearOne.grossIncome) * 100 : 0;

  const quitAge = jobEnd && !jobEnd.endedBeforeStart ? ageSuffix(jobEnd.chartX - points[0].decimalYear) : "";
  const quitMessage =
    jobEnd === null
      ? "No quit date set. Job income continues throughout."
      : jobEnd.endedBeforeStart
        ? `Job income ended on ${formatQuitDate(jobEnd.date)}, before the start date.`
        : `Job income stops on ${formatQuitDate(jobEnd.date)}${quitAge}.`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ backgroundColor: `${color}14` }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
            Time to goal
          </p>
          {isFastest && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
              Fastest
            </span>
          )}
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{headlineValue}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{headlineSub}</p>
      </div>

      <div>
        <SectionTitle>Net worth over time</SectionTitle>
        <NetWorthLineChart result={result} settings={settings} color={color} />
      </div>

      <div>
        <SectionTitle>Income in {points[0].year}</SectionTitle>
        <dl className="divide-y divide-slate-100 dark:divide-slate-700">
          <StatRow label="Gross income (job + self-employment)" value={formatCurrency(yearOne.grossIncome)} />
          <StatRow label="Less self-employment expenses" value={deduction(yearOne.selfExpenses)} />
          <StatRow label="Taxable income" value={formatCurrency(yearOne.taxableIncome)} />
          <StatRow label="Less federal tax" value={deduction(yearOne.tax.federal)} />
          <StatRow label="Less provincial tax" value={deduction(yearOne.tax.provincial)} />
        </dl>
        <div className="mt-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800/60">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Effective after-tax income</span>
            <span className="text-lg font-bold tabular-nums">{formatCurrency(yearOne.afterTaxIncome)}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {formatCurrency(yearOne.afterTaxIncome / 12)} per month · {taxRate.toFixed(1)}% effective tax rate
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-3 text-sm" style={{ borderColor: color, color }}>
        {quitMessage}
      </div>
    </div>
  );
}
