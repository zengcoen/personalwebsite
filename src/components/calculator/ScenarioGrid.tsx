"use client";

import { Fragment, type RefObject } from "react";
import { FieldControl, FieldLabel, FIELD_SECTIONS, isFieldVisible, type FieldSpec } from "@/components/calculator/scenarioFields";
import { ResultsSummary } from "@/components/calculator/ResultsSummary";
import { ScenarioHeader } from "@/components/calculator/ScenarioHeader";
import { scenarioColor } from "@/lib/defaults";
import type { Scenario, ScenarioResult, Settings } from "@/lib/types";

const LABEL_WIDTH = 170;
const CARD_MIN_WIDTH = 340;
const COLUMN_GAP = 16;

type Row =
  | { kind: "header" }
  | { kind: "summary" }
  | { kind: "section"; title: string }
  | { kind: "field"; field: FieldSpec };

type Props = {
  scenarios: Scenario[];
  results: Record<string, ScenarioResult>;
  settings: Settings;
  fastest: string[];
  canDelete: boolean;
  onUpdate: (id: string, patch: Partial<Scenario>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  scrollerRef: RefObject<HTMLDivElement | null>;
};

// Wide layout: one shared label column, and one column per scenario. Each row lines up across scenarios.
export function ScenarioGrid({
  scenarios,
  results,
  settings,
  fastest,
  canDelete,
  onUpdate,
  onDuplicate,
  onDelete,
  onReset,
  scrollerRef,
}: Props) {
  const rows: Row[] = [{ kind: "header" }, { kind: "summary" }];
  for (const section of FIELD_SECTIONS) {
    const fields = section.fields.filter((field) => scenarios.some((scenario) => isFieldVisible(field, scenario)));
    if (fields.length === 0) continue;
    rows.push({ kind: "section", title: section.title });
    for (const field of fields) rows.push({ kind: "field", field });
  }
  const rowCount = rows.length;
  const template = `${LABEL_WIDTH}px repeat(${scenarios.length}, minmax(${CARD_MIN_WIDTH}px, 1fr))`;

  return (
    <div ref={scrollerRef} className="overflow-x-auto pb-4 pt-1">
      <div className="grid w-full" style={{ gridTemplateColumns: template, columnGap: COLUMN_GAP }}>
        {/* Card frames sit behind the cells and span every row, so each scenario reads as one card. */}
        {scenarios.map((scenario, index) => {
          const color = scenarioColor(scenario);
          return (
            <div
              key={`frame-${scenario.id}`}
              aria-hidden="true"
              className="pointer-events-none rounded-2xl border-2 bg-white shadow-sm dark:bg-slate-900"
              style={{
                gridColumn: index + 2,
                gridRow: `1 / ${rowCount + 1}`,
                borderColor: color,
              }}
            />
          );
        })}

        {rows.map((row, rowIndex) => {
          const gridRow = rowIndex + 1;
          const key =
            row.kind === "field"
              ? `field-${String(row.field.key)}`
              : row.kind === "section"
                ? `section-${row.title}`
                : row.kind;

          return (
            <Fragment key={key}>
              <div
                className={
                  row.kind === "section"
                    ? "flex items-end pb-1 pt-5 pr-3"
                    : `flex items-center py-2 pr-3 ${row.kind === "field" ? "border-b border-slate-100 dark:border-slate-700" : ""}`
                }
                style={{ gridColumn: 1, gridRow }}
              >
                {row.kind === "section" && (
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                    {row.title}
                  </h3>
                )}
                {row.kind === "field" && <FieldLabel label={row.field.label} info={row.field.info} />}
              </div>

              {scenarios.map((scenario, index) => {
                const color = scenarioColor(scenario);
                const cellStyle = { gridColumn: index + 2, gridRow };
                const id = scenario.id;

                if (row.kind === "header") {
                  return (
                    <div key={id} style={cellStyle}>
                      <ScenarioHeader
                        scenario={scenario}
                        color={color}
                        canDelete={canDelete}
                        onUpdate={(patch) => onUpdate(id, patch)}
                        onDuplicate={() => onDuplicate(id)}
                        onReset={() => onReset(id)}
                        onDelete={() => onDelete(id)}
                      />
                    </div>
                  );
                }

                if (row.kind === "summary") {
                  return (
                    <div key={id} className="border-b border-slate-200 p-4 dark:border-slate-700" style={cellStyle}>
                      <ResultsSummary
                        result={results[id]}
                        settings={settings}
                        color={color}
                        isFastest={fastest.includes(id)}
                      />
                    </div>
                  );
                }

                if (row.kind === "section") {
                  return <div key={id} style={cellStyle} />;
                }

                const visible = isFieldVisible(row.field, scenario);
                return (
                  <div
                    key={id}
                    className="flex items-center border-b border-slate-100 px-4 py-2 dark:border-slate-700"
                    style={cellStyle}
                  >
                    {visible && (
                      <div className="w-full">
                        <FieldControl
                          field={row.field}
                          scenario={scenario}
                          onUpdate={(patch) => onUpdate(id, patch)}
                          hideLabel
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
