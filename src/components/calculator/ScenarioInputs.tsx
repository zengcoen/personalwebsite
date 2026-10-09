"use client";

import type { ReactNode } from "react";
import { FieldControl, FIELD_SECTIONS, isFieldVisible } from "@/components/calculator/scenarioFields";
import type { Scenario } from "@/lib/types";

type Props = {
  scenario: Scenario;
  onUpdate: (patch: Partial<Scenario>) => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400">{title}</h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

// Mobile layout: each card shows its own labels above the inputs.
export function ScenarioInputs({ scenario, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {FIELD_SECTIONS.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.fields
            .filter((field) => isFieldVisible(field, scenario))
            .map((field) => (
              <FieldControl
                key={String(field.key)}
                field={field}
                scenario={scenario}
                onUpdate={onUpdate}
                hideLabel={false}
              />
            ))}
        </Section>
      ))}
    </div>
  );
}
