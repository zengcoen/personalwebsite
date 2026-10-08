import type { Metadata } from "next";
import { NetWorthCalculator } from "@/components/calculator/NetWorthCalculator";

export const metadata: Metadata = {
  title: "Net Worth Goal Calculator – Canada",
  description:
    "Project when you reach your net worth goal with multiple Canadian tax scenarios, job quit dates, and investing assumptions.",
};

export default function NetWorthCalculatorPage() {
  return <NetWorthCalculator />;
}
