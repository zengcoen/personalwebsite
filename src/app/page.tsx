import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <Link
        href="/net-worth-calculator"
        className="text-lg font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
      >
        Net Worth Goal Calculator – Canada
      </Link>
    </main>
  );
}
