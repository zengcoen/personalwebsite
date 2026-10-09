"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { horizonMonths, monthlyIncomeCurve } from "@/lib/selfIncome";
import type { Scenario } from "@/lib/types";

type Props = {
  scenario: Scenario;
  color: string;
};

// Recomputes the monthly coordinate array whenever any curve input changes. The math is cheap, so this stays instant.
export function IncomeCurveChart({ scenario, color }: Props) {
  const gradientId = `income-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const horizon = horizonMonths(scenario.selfHorizonYears);
  const data = useMemo(() => monthlyIncomeCurve(scenario, horizon), [scenario, horizon]);

  return (
    <div className="h-32 w-full text-slate-500 dark:text-slate-300">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, horizon]}
            tickCount={4}
            tickFormatter={(month: number) => `Yr ${Math.round(month / 12)}`}
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            width={52}
            tickCount={3}
            domain={[0, "auto"]}
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: "currentColor", strokeOpacity: 0.3 }}
            formatter={(value) => [`${formatCurrency(Number(value))} / yr`, "Income"]}
            labelFormatter={(month) => `Month ${month}`}
          />
          {/* Stepwise income jumps instantly, so draw it as steps instead of a smoothed curve. */}
          <Area
            type={scenario.selfShape === "stepwise" ? "stepAfter" : "monotone"}
            dataKey="y"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
