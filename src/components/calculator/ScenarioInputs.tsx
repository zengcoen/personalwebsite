"use client";

import type { ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { NumberField } from "@/components/ui/NumberField";
import { inputClass, secondaryButton } from "@/components/ui/styles";
import type { Scenario } from "@/lib/types";

type Props = {
  scenario: Scenario;
  onUpdate: (patch: Partial<Scenario>) => void;
  onReset: () => void;
};

const TAX_INFO =
  "Federal plus provincial tax is applied with marginal brackets to taxable income. Credits, deductions, CPP/EI, and basic personal amounts are not modelled. Ontario includes the approximate surtax.";
const QUIT_INFO =
  "On and after this date, job income is $0. The quit year is prorated to the days worked before the date. Self-employment income continues.";
const JOB_GROWTH_INFO =
  "Job income grows by this rate each year from the start year. It is independent of self-employment growth.";
const SELF_GROWTH_INFO =
  "Self-employment income grows by its own rate each year, independent of job income growth.";
const SELF_EXPENSES_INFO =
  "Subtracted from self-employment income before tax, and paid out of cash flow each year. If expenses exceed income, the loss reduces cash flow but taxable income is floored at zero.";
const INVEST_INFO =
  "Added to the portfolio at the end of every month and compounded monthly at the expected return.";
const RETURN_INFO =
  "Expected average annual return on the portfolio. Converted to an equivalent monthly rate for compounding.";
const LIVING_INFO =
  "Monthly personal spending. Deducted from after-tax income each year. Leftover cash (after spending and investing) builds up uninvested with no growth.";
const NET_WORTH_INFO =
  "Starting net worth. Treated as already invested and earning the expected return.";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function ScenarioInputs({ scenario, onUpdate, onReset }: Props) {
  const id = (name: string) => `${scenario.id}-${name}`;

  return (
    <div className="space-y-6">
      <Section title="Location & tax">
        <Field id={id("province")} label="Province" info={TAX_INFO}>
          <select
            id={id("province")}
            value={scenario.province}
            onChange={(event) => onUpdate({ province: event.target.value === "ON" ? "ON" : "BC" })}
            className={inputClass}
          >
            <option value="BC">British Columbia</option>
            <option value="ON">Ontario</option>
          </select>
        </Field>
        <NumberField
          id={id("net-worth")}
          label="Current net worth"
          prefix="$"
          value={scenario.currentNetWorth}
          onChange={(currentNetWorth) => onUpdate({ currentNetWorth })}
          info={NET_WORTH_INFO}
        />
      </Section>

      <Section title="Employment">
        <NumberField
          id={id("job-income")}
          label="Job gross income (annual)"
          prefix="$"
          value={scenario.jobIncome}
          onChange={(jobIncome) => onUpdate({ jobIncome })}
        />
        <NumberField
          id={id("job-growth")}
          label="Job income growth"
          suffix="%"
          value={scenario.jobGrowth}
          onChange={(jobGrowth) => onUpdate({ jobGrowth })}
          info={JOB_GROWTH_INFO}
        />
        <Field id={id("quit-date")} label="Date to quit job" info={QUIT_INFO}>
          <div className="flex gap-2">
            <input
              id={id("quit-date")}
              type="date"
              value={scenario.quitDate}
              onChange={(event) => onUpdate({ quitDate: event.target.value })}
              className={inputClass}
            />
            {scenario.quitDate && (
              <button
                type="button"
                onClick={() => onUpdate({ quitDate: "" })}
                className={`${secondaryButton} shrink-0`}
              >
                Clear
              </button>
            )}
          </div>
        </Field>
      </Section>

      <Section title="Self-employment">
        <NumberField
          id={id("self-income")}
          label="Self-employment income (annual)"
          prefix="$"
          value={scenario.selfIncome}
          onChange={(selfIncome) => onUpdate({ selfIncome })}
        />
        <NumberField
          id={id("self-growth")}
          label="Self-employment growth"
          suffix="%"
          value={scenario.selfGrowth}
          onChange={(selfGrowth) => onUpdate({ selfGrowth })}
          info={SELF_GROWTH_INFO}
        />
        <NumberField
          id={id("self-expenses")}
          label="Self-employment expenses (annual)"
          prefix="$"
          value={scenario.selfExpenses}
          onChange={(selfExpenses) => onUpdate({ selfExpenses })}
          info={SELF_EXPENSES_INFO}
        />
      </Section>

      <Section title="Investing & spending">
        <NumberField
          id={id("monthly-invest")}
          label="Monthly investment"
          prefix="$"
          value={scenario.monthlyInvestment}
          onChange={(monthlyInvestment) => onUpdate({ monthlyInvestment })}
          info={INVEST_INFO}
        />
        <NumberField
          id={id("return")}
          label="Expected annual return"
          suffix="%"
          value={scenario.investmentReturn}
          onChange={(investmentReturn) => onUpdate({ investmentReturn })}
          info={RETURN_INFO}
        />
        <NumberField
          id={id("living")}
          label="Living expenses (monthly)"
          prefix="$"
          value={scenario.livingExpensesMonthly}
          onChange={(livingExpensesMonthly) => onUpdate({ livingExpensesMonthly })}
          info={LIVING_INFO}
        />
      </Section>

      <button type="button" onClick={onReset} className={`${secondaryButton} w-full`}>
        Reset to defaults
      </button>
    </div>
  );
}
