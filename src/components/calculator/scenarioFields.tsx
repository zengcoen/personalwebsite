"use client";

import { IncomeCurveChart } from "@/components/calculator/IncomeCurveChart";
import { Field } from "@/components/ui/Field";
import { InfoTip } from "@/components/ui/InfoTip";
import { NumberField } from "@/components/ui/NumberField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SliderField } from "@/components/ui/SliderField";
import { inputBase, inputClass, secondaryButton } from "@/components/ui/styles";
import { scenarioColor } from "@/lib/defaults";
import { formatPercent } from "@/lib/format";
import { INCOME_SHAPES, MAX_HORIZON_YEARS } from "@/lib/selfIncome";
import type { IncomeShape, Scenario } from "@/lib/types";

// Each field is defined once here. Wide layouts show the label in a shared column; mobile shows it above each input.

type NumberKey = { [K in keyof Scenario]: Scenario[K] extends number ? K : never }[keyof Scenario];

type FieldBase = {
  key: string;
  label: string;
  info?: string;
  visible?: (scenario: Scenario) => boolean;
};

export type FieldSpec = FieldBase &
  (
    | { kind: "province" }
    | { kind: "quitDate" }
    | { kind: "money"; field: NumberKey }
    | { kind: "count"; field: NumberKey; unit: string }
    | {
        kind: "slider";
        field: NumberKey;
        min: number;
        // A fixed maximum, or a function of the scenario (e.g. the inflection point is capped at the horizon).
        max: number | ((scenario: Scenario) => number);
        step: number;
        format?: (value: number) => string;
      }
    | { kind: "shape" }
    | { kind: "preview" }
  );

export type FieldSection = { title: string; fields: FieldSpec[] };

const TAX_INFO =
  "Federal plus provincial tax is applied with marginal brackets to taxable income. Credits, deductions, CPP/EI, and basic personal amounts are not modelled. Ontario includes the approximate surtax.";
const QUIT_INFO =
  "On and after this date, job income is $0. The quit year is prorated to the days worked before the date. Self-employment income continues.";
const JOB_GROWTH_INFO =
  "Job income grows by this rate each year from the start year. It is independent of self-employment income.";
const SELF_FLOOR_INFO =
  "Self-employment income in the start year. The curve begins here at month 0 and moves toward the ceiling.";
const SELF_CEILING_INFO =
  "The most self-employment income you expect to reach. Curves move toward this value over the horizon and hold there afterward.";
const SELF_HORIZON_INFO =
  "How many years it takes to move from the starting income to the ceiling. Between 1 and 60 years.";
const SHAPE_INFO =
  "S-Curve: slow start, rapid middle growth, then leveling off. Stepwise: flat, then sudden jumps at fixed intervals.";
const SELF_EXPENSES_INFO =
  "Subtracted from self-employment income before tax, and paid out of cash flow each year. If expenses exceed income, the loss reduces cash flow but taxable income is floored at zero.";
const NET_WORTH_INFO = "Starting net worth. Treated as already invested and earning the expected return.";
const INVEST_INFO =
  "Share of spare cash invested each month, compounded monthly at the expected return. Spare cash is after-tax income minus living expenses. 100% invests everything left after living costs; the rest builds up as uninvested cash. If spare cash is negative, nothing is invested.";
const RETURN_INFO =
  "Expected average annual return on the portfolio. Converted to an equivalent monthly rate for compounding.";
const LIVING_INFO =
  "Monthly personal spending. Deducted from after-tax income each year. Leftover cash (after spending and investing) builds up uninvested with no growth.";
const POST_QUIT_LIVING_INFO =
  "Monthly living expenses from the quit date onward. They replace the living expenses above for the rest of the projection. The quit year is prorated.";
const INFLECTION_INFO =
  "The year when growth is fastest, counted from the start date. Before it, growth is slow; after it, growth slows as the curve approaches the ceiling. Cannot be later than the horizon.";
const STEEPNESS_INFO =
  "How sharply the S-curve turns around the inflection point. Higher values make a faster transition.";
const STEP_EVERY_INFO = "Months between each income jump.";
const STEP_MAGNITUDE_INFO = "Annual income added at each jump. Income stops rising once it reaches the ceiling.";
const months = (value: number) => `${value} mo`;
const years = (value: number) => `${value} yr`;

export const FIELD_SECTIONS: FieldSection[] = [
  {
    title: "Location & tax",
    fields: [
      { kind: "province", key: "province", label: "Province", info: TAX_INFO },
      { kind: "money", key: "currentNetWorth", field: "currentNetWorth", label: "Current net worth", info: NET_WORTH_INFO },
    ],
  },
  {
    title: "Employment",
    fields: [
      { kind: "money", key: "jobIncome", field: "jobIncome", label: "Job gross income (annual)" },
      {
        kind: "slider",
        key: "jobGrowth",
        field: "jobGrowth",
        label: "Job income growth",
        info: JOB_GROWTH_INFO,
        min: -5,
        max: 15,
        step: 0.1,
        format: formatPercent,
      },
      { kind: "quitDate", key: "quitDate", label: "Date to quit job", info: QUIT_INFO },
      {
        kind: "money",
        key: "postQuitLivingMonthly",
        field: "postQuitLivingMonthly",
        label: "Living expenses after quitting (monthly)",
        info: POST_QUIT_LIVING_INFO,
        visible: (scenario) => scenario.quitDate !== "",
      },
    ],
  },
  {
    title: "Self-employment",
    fields: [
      { kind: "money", key: "selfIncome", field: "selfIncome", label: "Starting income (floor, annual)", info: SELF_FLOOR_INFO },
      { kind: "money", key: "selfCeiling", field: "selfCeiling", label: "Max target income (ceiling, annual)", info: SELF_CEILING_INFO },
      {
        kind: "count",
        key: "selfHorizonYears",
        field: "selfHorizonYears",
        unit: "years",
        label: "Horizon (years)",
        info: SELF_HORIZON_INFO,
      },
      { kind: "shape", key: "selfShape", label: "Growth shape", info: SHAPE_INFO },

      // S-Curve controls
      {
        kind: "slider",
        key: "sInflectionYears",
        field: "sInflectionYears",
        label: "Inflection point (years)",
        info: INFLECTION_INFO,
        min: 0,
        // Capped at the horizon: the curve's midpoint can never fall after the curve ends.
        max: (scenario) => Math.min(MAX_HORIZON_YEARS, scenario.selfHorizonYears),
        step: 1,
        format: years,
        visible: (scenario) => scenario.selfShape === "s-curve",
      },
      {
        kind: "slider",
        key: "sSteepness",
        field: "sSteepness",
        label: "Growth steepness",
        info: STEEPNESS_INFO,
        min: 1,
        max: 10,
        step: 0.5,
        format: (value) => `${value}`,
        visible: (scenario) => scenario.selfShape === "s-curve",
      },

      // Stepwise controls
      {
        kind: "slider",
        key: "stepEveryMonths",
        field: "stepEveryMonths",
        label: "Jump every (months)",
        info: STEP_EVERY_INFO,
        min: 1,
        max: 60,
        step: 1,
        format: months,
        visible: (scenario) => scenario.selfShape === "stepwise",
      },
      {
        kind: "money",
        key: "stepMagnitude",
        field: "stepMagnitude",
        label: "Jump size (annual, per step)",
        info: STEP_MAGNITUDE_INFO,
        visible: (scenario) => scenario.selfShape === "stepwise",
      },

      { kind: "preview", key: "incomeCurve", label: "Income curve" },
      { kind: "money", key: "selfExpenses", field: "selfExpenses", label: "Self-employment expenses (annual)", info: SELF_EXPENSES_INFO },
    ],
  },
  {
    title: "Investing & spending",
    fields: [
      {
        kind: "slider",
        key: "investmentPercent",
        field: "investmentPercent",
        label: "Monthly investment",
        info: INVEST_INFO,
        min: 0,
        max: 100,
        step: 1,
        format: formatPercent,
      },
      {
        kind: "slider",
        key: "investmentReturn",
        field: "investmentReturn",
        label: "Expected annual return",
        info: RETURN_INFO,
        min: -5,
        max: 20,
        step: 0.1,
        format: formatPercent,
      },
      {
        kind: "money",
        key: "livingExpensesMonthly",
        field: "livingExpensesMonthly",
        label: "Living expenses (monthly)",
        info: LIVING_INFO,
      },
    ],
  },
];

export function isFieldVisible(field: FieldSpec, scenario: Scenario): boolean {
  return field.visible ? field.visible(scenario) : true;
}

type FieldControlProps = {
  field: FieldSpec;
  scenario: Scenario;
  onUpdate: (patch: Partial<Scenario>) => void;
  hideLabel: boolean;
};

// Shared label for controls that are not plain inputs (segmented control, chart). Hidden in wide layouts.
function BlockLabel({ label, info }: { label: string; info?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      {info && <InfoTip text={info} label={label} />}
    </div>
  );
}

export function FieldControl({ field, scenario, onUpdate, hideLabel }: FieldControlProps) {
  const id = `${scenario.id}-${field.key}`;

  switch (field.kind) {
    case "province":
      return (
        <Field id={id} label={field.label} info={field.info} hideLabel={hideLabel}>
          <div className="relative">
            <select
              id={id}
              value={scenario.province}
              onChange={(event) => onUpdate({ province: event.target.value === "ON" ? "ON" : "BC" })}
              className={`${inputBase} appearance-none pl-3 pr-9`}
            >
              <option value="BC">British Columbia</option>
              <option value="ON">Ontario</option>
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-slate-500 dark:text-slate-300"
            >
              <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" />
            </svg>
          </div>
        </Field>
      );
    case "quitDate":
      return (
        <Field id={id} label={field.label} info={field.info} hideLabel={hideLabel}>
          <div className="flex gap-2">
            <input
              id={id}
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
      );
    case "slider": {
      const max = typeof field.max === "function" ? field.max(scenario) : field.max;
      return (
        <SliderField
          id={id}
          label={field.label}
          info={field.info}
          hideLabel={hideLabel}
          value={Math.min(scenario[field.field], max)}
          onChange={(value) => onUpdate({ [field.field]: value } as Partial<Scenario>)}
          min={field.min}
          max={max}
          step={field.step}
          format={field.format}
        />
      );
    }
    case "money":
      return (
        <NumberField
          id={id}
          label={field.label}
          info={field.info}
          hideLabel={hideLabel}
          prefix="$"
          value={scenario[field.field]}
          onChange={(value) => onUpdate({ [field.field]: value } as Partial<Scenario>)}
        />
      );
    case "count":
      return (
        <NumberField
          id={id}
          label={field.label}
          info={field.info}
          hideLabel={hideLabel}
          suffix={field.unit}
          value={scenario[field.field]}
          onChange={(value) => onUpdate({ [field.field]: value } as Partial<Scenario>)}
        />
      );
    case "shape":
      return (
        <div className="flex flex-col gap-1.5">
          {!hideLabel && <BlockLabel label={field.label} info={field.info} />}
          <SegmentedControl<IncomeShape>
            label={field.label}
            options={INCOME_SHAPES}
            value={scenario.selfShape}
            onChange={(selfShape) => onUpdate({ selfShape })}
          />
        </div>
      );
    case "preview":
      return (
        <div className="flex flex-col gap-1.5">
          {!hideLabel && <BlockLabel label={field.label} />}
          <IncomeCurveChart scenario={scenario} color={scenarioColor(scenario)} />
        </div>
      );
  }
}

// Label + info tip for the shared label column (wide layouts).
export function FieldLabel({ label, info }: { label: string; info?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">{label}</span>
      {info && <InfoTip text={info} label={label} />}
    </div>
  );
}
