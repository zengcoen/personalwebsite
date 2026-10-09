export type Province = "BC" | "ON";

export type IncomeShape = "s-curve" | "stepwise";

export type ScenarioInputs = {
  province: Province;
  currentNetWorth: number;
  jobIncome: number;
  jobGrowth: number;
  quitDate: string;
  // Self-employment income curve: floor (selfIncome) to ceiling over a horizon, shaped by `selfShape`.
  selfIncome: number;
  selfCeiling: number;
  selfHorizonYears: number;
  selfShape: IncomeShape;
  // S-curve inflection point, in years from the start. Kept within the horizon.
  sInflectionYears: number;
  sSteepness: number;
  stepEveryMonths: number;
  stepMagnitude: number;
  selfExpenses: number;
  // Share of spare cash (after-tax income minus living expenses) invested each month, 0 to 100.
  investmentPercent: number;
  investmentReturn: number;
  livingExpensesMonthly: number;
  postQuitLivingMonthly: number;
};

export type Scenario = ScenarioInputs & {
  id: string;
  title: string;
  colorIndex: number;
};

export type Settings = {
  goal: number;
  // Exact projection start date (YYYY-MM-DD). The first projected year is prorated from this date.
  startDate: string;
  currentAge: number | null;
  inflationOn: boolean;
  inflationRate: number;
  // Length of every net worth chart in years. 0 means Auto (fits the goal date).
  chartYears: number;
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
  // Calendar year label (year containing this point).
  year: number;
  // Exact calendar position as a decimal year, e.g. 2026.77 for early October 2026.
  decimalYear: number;
  // Years elapsed since the start date.
  elapsedYears: number;
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
  // Exact years from the start date to the goal (fractional), or null if not reached.
  yearsToGoal: number | null;
  // Exact goal date (YYYY-MM-DD), or null if not reached.
  goalDate: string | null;
  milestones: Milestone[];
  decisionIndex: number;
  yearOne: YearBreakdown;
  jobEnd: JobEnd | null;
};
