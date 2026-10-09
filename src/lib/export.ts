import { MILESTONE_YEARS, parseIsoDate } from "@/lib/projection";
import { formatCurrency, formatQuitDate } from "@/lib/format";
import type { PlannerState, Scenario, ScenarioResult, Settings } from "@/lib/types";

type Metric = [label: string, value: (scenario: Scenario, result: ScenarioResult) => string];

function decisionPoint(result: ScenarioResult) {
  return result.points[result.decisionIndex];
}

function metricsFor(settings: Settings): Metric[] {
  const milestones: Metric[] = MILESTONE_YEARS.map((years): Metric => [
    `Net worth in ${years} years`,
    (_, result) => formatCurrency(result.milestones.find((m) => m.years === years)?.point.netWorth ?? 0),
  ]);
  return [
    ["Dollar basis", () => (settings.inflationOn ? `Today's dollars (${settings.inflationRate}% inflation)` : "Future (nominal) dollars")],
    ["Net worth goal", () => formatCurrency(settings.goal)],
    ["Province", (scenario) => (scenario.province === "ON" ? "Ontario" : "British Columbia")],
    ["Years to goal", (_, result) => (result.yearsToGoal === null ? "Not reached in 60 years" : result.yearsToGoal.toFixed(1))],
    ["Goal date", (_, result) => (result.goalDate === null ? "" : formatQuitDate(result.goalDate))],
    ...milestones,
    ["Total invested (as of goal date or year 20)", (_, result) => formatCurrency(decisionPoint(result).principal)],
    ["Investment growth", (_, result) => formatCurrency(decisionPoint(result).portfolio - decisionPoint(result).principal)],
    ["Cash not invested", (_, result) => formatCurrency(decisionPoint(result).cash)],
    ["Job income ends", (scenario) => {
      const quit = parseIsoDate(scenario.quitDate);
      return quit ? formatQuitDate(scenario.quitDate) : "No quit date";
    }],
    ["Year 1 gross income", (_, result) => formatCurrency(result.yearOne.grossIncome)],
    ["Year 1 self-employment expenses", (_, result) => formatCurrency(result.yearOne.selfExpenses)],
    ["Year 1 federal tax", (_, result) => formatCurrency(result.yearOne.tax.federal)],
    ["Year 1 provincial tax", (_, result) => formatCurrency(result.yearOne.tax.provincial)],
    ["Year 1 effective after-tax income", (_, result) => formatCurrency(result.yearOne.afterTaxIncome)],
    ["Year 1 after-tax income per month", (_, result) => formatCurrency(result.yearOne.afterTaxIncome / 12)],
  ];
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsv(state: PlannerState, results: Record<string, ScenarioResult>): string {
  const metrics = metricsFor(state.settings);
  const header = ["Metric", ...state.scenarios.map((scenario) => scenario.title)];
  const rows = metrics.map(([label, value]) => [
    label,
    ...state.scenarios.map((scenario) => value(scenario, results[scenario.id])),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildText(state: PlannerState, results: Record<string, ScenarioResult>): string {
  const metrics = metricsFor(state.settings);
  const header = [
    "Net Worth Goal Calculator - Canada",
    `Start date: ${formatQuitDate(state.settings.startDate)}`,
    "",
  ];
  const blocks = state.scenarios.map((scenario) =>
    [
      `${scenario.title}`,
      ...metrics.map(([label, value]) => `  ${label}: ${value(scenario, results[scenario.id])}`),
    ].join("\n"),
  );
  return [...header, blocks.join("\n\n"), "", "This is a simplified educational tool. Actual taxes, investment returns, and expenses will vary. Consult a financial advisor."].join("\n");
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
