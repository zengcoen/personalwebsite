"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// The year under the cursor, shared by every net worth chart so they all show the same moment.
// Values are exact decimal years (e.g. 2031.5), which are the same on every chart because all scenarios share a start date.
type ChartHover = {
  hoverX: number | null;
  setHoverX: (x: number | null) => void;
};

const ChartHoverContext = createContext<ChartHover>({ hoverX: null, setHoverX: () => {} });

export function ChartHoverProvider({ children }: { children: ReactNode }) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const value = useMemo(() => ({ hoverX, setHoverX }), [hoverX]);
  return <ChartHoverContext.Provider value={value}>{children}</ChartHoverContext.Provider>;
}

export function useChartHover(): ChartHover {
  return useContext(ChartHoverContext);
}
