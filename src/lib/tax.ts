import type { Province, TaxBreakdown } from "@/lib/types";

type Bracket = {
  upTo: number | null;
  rate: number;
};

export const FEDERAL_BRACKETS: Bracket[] = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: null, rate: 0.33 },
];

export const PROVINCES: Record<Province, { name: string; brackets: Bracket[] }> = {
  BC: {
    name: "British Columbia",
    brackets: [
      { upTo: 50363, rate: 0.056 },
      { upTo: 100728, rate: 0.077 },
      { upTo: 115648, rate: 0.105 },
      { upTo: 140430, rate: 0.1229 },
      { upTo: 190405, rate: 0.147 },
      { upTo: 265545, rate: 0.168 },
      { upTo: null, rate: 0.205 },
    ],
  },
  ON: {
    name: "Ontario",
    brackets: [
      { upTo: 52886, rate: 0.0505 },
      { upTo: 105775, rate: 0.0915 },
      { upTo: 150000, rate: 0.1116 },
      { upTo: 220000, rate: 0.1216 },
      { upTo: null, rate: 0.1316 },
    ],
  },
};

const ONTARIO_SURTAX_FIRST_THRESHOLD = 5710;
const ONTARIO_SURTAX_SECOND_THRESHOLD = 7307;

export function progressiveTax(income: number, brackets: Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const bracket of brackets) {
    if (income <= lower) break;
    const upper = bracket.upTo ?? Infinity;
    tax += (Math.min(income, upper) - lower) * bracket.rate;
    lower = upper;
  }
  return tax;
}

export function calculateTax(taxableIncome: number, province: Province): TaxBreakdown {
  const income = Math.max(0, taxableIncome);
  const federal = progressiveTax(income, FEDERAL_BRACKETS);
  const provincialBasic = progressiveTax(income, PROVINCES[province].brackets);
  const surtax =
    province === "ON"
      ? 0.2 * Math.max(0, provincialBasic - ONTARIO_SURTAX_FIRST_THRESHOLD) +
        0.36 * Math.max(0, provincialBasic - ONTARIO_SURTAX_SECOND_THRESHOLD)
      : 0;
  const provincial = provincialBasic + surtax;
  return { federal, provincial, total: federal + provincial };
}
