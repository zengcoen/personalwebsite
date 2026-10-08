export type Province = "BC" | "ON";

export type ScenarioInputs = {
  province: Province;
  currentNetWorth: number;
  jobIncome: number;
  jobGrowth: number;
  quitDate: string;
  selfIncome: number;
  selfGrowth: number;
  selfExpenses: number;
  monthlyInvestment: number;
  investmentReturn: number;
  livingExpensesMonthly: number;
};

export type Scenario = ScenarioInputs & {
  id: string;
  title: string;
  colorIndex: number;
};

export type Settings = {
  goal: number;
  startYear: number;
  currentAge: number | null;
  inflationOn: boolean;
  inflationRate: number;
};

export type PlannerState = {
  settings: Settings;
  scenarios: Scenario[];
};

export type TaxBreakdown = {
  federal: number;
  provincial: number;
  total: number;
};

export type ProjectionPoint = {
  index: number;
  year: number;
  netWorth: number;
  portfolio: number;
  cash: number;
  principal: number;
};

export type YearBreakdown = {
  grossIncome: number;
  selfExpenses: number;
  taxableIncome: number;
  tax: TaxBreakdown;
  afterTaxIncome: number;
  livingExpenses: number;
  investmentContributions: number;
  annualSurplus: number;
};

export type JobEnd = {
  date: string;
  year: number;
  chartX: number;
  endedBeforeStart: boolean;
};

export type Milestone = {
  years: number;
  point: ProjectionPoint;
};

export type ScenarioResult = {
  points: ProjectionPoint[];
  yearsToGoal: number | null;
  goalYear: number | null;
  milestones: Milestone[];
  decisionIndex: number;
  yearOne: YearBreakdown;
  jobEnd: JobEnd | null;
};
