"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartHover } from "@/components/calculator/ChartHoverContext";
import { formatCompactCurrency } from "@/lib/format";
import { chartSeries } from "@/lib/projection";
import type { ScenarioResult, Settings } from "@/lib/types";

type Props = {
  result: ScenarioResult;
  settings: Settings;
  color: string;
};

const GOAL_COLOR = "#ef4444";

type ChartPoint = { x: number; netWorth: number; year: number; elapsedYears: number };

// The point closest to a given year.
function nearestPoint(data: ChartPoint[], x: number): ChartPoint {
  return data.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best), data[0]);
}

export function NetWorthLineChart({ result, settings, color }: Props) {
  const gradientId = `fill-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { hoverX, setHoverX } = useChartHover();
  // x is the exact decimal year, so the first point sits at the start date and later points at each January 1.
  const { points: series } = chartSeries(result, settings.chartYears);
  const data: ChartPoint[] = series.map((point) => ({
    x: point.decimalYear,
    netWorth: point.netWorth,
    year: point.year,
    elapsedYears: point.elapsedYears,
  }));
  const firstX = data[0].x;
  const lastX = data[data.length - 1].x;
  const jobEnd = result.jobEnd;
  const showJobEnd = jobEnd !== null && !jobEnd.endedBeforeStart && jobEnd.chartX <= lastX;

  // The shared hover year may come from another chart. Only show it here if this chart covers that year.
  const inRange = hoverX !== null && hoverX >= firstX - 1e-9 && hoverX <= lastX + 1e-9;
  const hovered = inRange && hoverX !== null ? nearestPoint(data, hoverX) : undefined;
  const hoveredAge =
    hovered && settings.currentAge !== null ? settings.currentAge + Math.round(hovered.elapsedYears) : null;

  return (
    <div>
      <div className="h-48 w-full text-slate-500 dark:text-slate-300">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 16, right: 8, bottom: 0, left: 0 }}
            onMouseMove={(state) => {
              const index = Number(state.activeTooltipIndex);
              setHoverX(Number.isFinite(index) && data[index] ? data[index].x : null);
            }}
            onMouseLeave={() => setHoverX(null)}
          >
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
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
              tickCount={4}
              tick={{ fill: "currentColor", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              width={52}
              tickCount={3}
              domain={[(dataMin: number) => Math.min(0, dataMin), "auto"]}
              tick={{ fill: "currentColor", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            {/* The crosshair is drawn below from the shared hover year, so every chart shows the same moment. */}
            <Tooltip cursor={false} content={() => null} />
            {inRange && hoverX !== null && (
              <ReferenceLine x={hoverX} stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
            )}
            <ReferenceLine
              y={settings.goal}
              stroke={GOAL_COLOR}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Goal ${formatCompactCurrency(settings.goal)}`,
                position: "insideTopLeft",
                fill: GOAL_COLOR,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            {showJobEnd && jobEnd && (
              <ReferenceLine x={jobEnd.chartX} stroke={color} strokeDasharray="2 4" strokeWidth={1.5} />
            )}
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Reserved height so the layout does not jump when the readout appears. */}
      <p className="mt-2 flex h-5 items-center justify-center gap-2 text-xs tabular-nums text-slate-700 dark:text-slate-200" aria-live="polite">
        {hovered && (
          <>
            <span className="font-semibold text-slate-900 dark:text-white">{formatCompactCurrency(hovered.netWorth)}</span>
            <span aria-hidden="true">·</span>
            <span>{hovered.year}</span>
            {hoveredAge !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span>age {hoveredAge}</span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
