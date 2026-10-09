import type { ReactNode } from "react";
import { InfoTip } from "@/components/ui/InfoTip";

export function Field({
  id,
  label,
  info,
  hideLabel = false,
  children,
}: {
  id: string;
  label: string;
  info?: string;
  hideLabel?: boolean;
  children: ReactNode;
}) {
  if (hideLabel) {
    // Label is shown elsewhere (e.g. a shared column); keep it for screen readers.
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300"
        >
          {label}
        </label>
        {info && <InfoTip text={info} label={label} />}
      </div>
      {children}
    </div>
  );
}
