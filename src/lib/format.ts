const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const longDate = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: number): string {
  return currency.format(Math.round(value) || 0);
}

export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value);
}

export function formatYears(years: number): string {
  return `${years} ${years === 1 ? "year" : "years"}`;
}

export function formatQuitDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return longDate.format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
