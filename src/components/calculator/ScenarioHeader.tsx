"use client";

import { ScenarioMenu } from "@/components/calculator/ScenarioMenu";
import type { Scenario } from "@/lib/types";

type Props = {
  scenario: Scenario;
  color: string;
  canDelete: boolean;
  onUpdate: (patch: Partial<Scenario>) => void;
  onDuplicate: () => void;
  onReset: () => void;
  onDelete: () => void;
};

export function ScenarioHeader({ scenario, color, canDelete, onUpdate, onDuplicate, onReset, onDelete }: Props) {
  return (
    <header className="flex items-center gap-2 rounded-t-[14px] p-4 pb-3" style={{ backgroundColor: `${color}12` }}>
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <input
        aria-label="Scenario title"
        value={scenario.title}
        maxLength={60}
        onChange={(event) => onUpdate({ title: event.target.value })}
        onBlur={() => {
          if (!scenario.title.trim()) onUpdate({ title: "Untitled scenario" });
        }}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-lg font-semibold outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500/30 dark:focus:bg-slate-900"
      />
      <ScenarioMenu
        title={scenario.title}
        canDelete={canDelete}
        onDuplicate={onDuplicate}
        onReset={onReset}
        onDelete={onDelete}
      />
    </header>
  );
}
