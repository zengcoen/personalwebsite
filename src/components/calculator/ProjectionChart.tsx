"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/calculator/ChartTooltip";
import { scenarioColor } from "@/lib/defaults";
import { formatCompactCurrency } from "@/lib/format";
import type { Scenario, ScenarioResult, Settings } from "@/lib/types";

type Props = {
  scenarios: Scenario[];
  results: Record<string, ScenarioResult>;
  settings: Settings;
  horizon: number;
};

const GOAL_COLOR = "#ef4444";

export function ProjectionChart({ scenarios, results, settings, horizon }: Props) {
  const data = useMemo(
    () =>
      Array.from({ length: horizon + 1 }, (_, index) => {
        const row: Record<string, number> = { year: settings.startYear + index };
        for (const scenario of scenarios) {
          row[scenario.id] = results[scenario.id].points[index].netWorth;
        }
        return row;
      }),
    [scenarios, results, settings.startYear, horizon],
  );

  const endYear = settings.startYear + horizon;

  return (
    <section
      aria-label="Projected net worth"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Projected net worth</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {settings.inflationOn ? "Values in today's dollars. " : ""}Dashed vertical lines mark the year job income stops. Dots mark when each scenario reaches the goal.
        </p>
      </div>
      <div className="h-[300px] w-full text-slate-500 sm:h-[420px] dark:text-slate-400">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 28, right: 20, bottom: 8, left: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[settings.startYear, endYear]}
              allowDecimals={false}
              tick={{ fill: "currentColor", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              width={78}
              domain={["auto", "auto"]}
              tick={{ fill: "currentColor", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: "currentColor", strokeOpacity: 0.3 }}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  label={props.label}
                  scenarios={scenarios}
                  results={results}
                  startYear={settings.startYear}
                />
              )}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: 12 }} />
            <ReferenceLine
              y={settings.goal}
              stroke={GOAL_COLOR}
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Goal ${formatCompactCurrency(settings.goal)}`,
                position: "insideTopLeft",
                fill: GOAL_COLOR,
                fontSize: 12,
              }}
            />
            {scenarios.map((scenario) => {
              const jobEnd = results[scenario.id].jobEnd;
              if (!jobEnd || jobEnd.endedBeforeStart || jobEnd.chartX > endYear) return null;
              const color = scenarioColor(scenario);
              return (
                <ReferenceLine
                  key={`${scenario.id}-job-end`}
                  x={jobEnd.chartX}
                  stroke={color}
                  strokeDasharray="2 4"
                  label={{
                    value: `Job ends ${jobEnd.year}`,
                    position: "top",
                    fill: color,
                    fontSize: 11,
                  }}
                />
              );
            })}
            {scenarios.map((scenario) => {
              const result = results[scenario.id];
              if (result.yearsToGoal === null || result.goalYear === null) return null;
              return (
                <ReferenceDot
                  key={`${scenario.id}-goal-dot`}
                  x={result.goalYear}
                  y={result.points[result.yearsToGoal].netWorth}
                  r={5}
                  fill={scenarioColor(scenario)}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            })}
            {scenarios.map((scenario) => (
              <Line
                key={scenario.id}
                type="monotone"
                dataKey={scenario.id}
                name={scenario.title}
                stroke={scenarioColor(scenario)}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
