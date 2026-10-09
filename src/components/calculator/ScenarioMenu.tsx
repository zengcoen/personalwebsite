"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  canDelete: boolean;
  onDuplicate: () => void;
  onReset: () => void;
  onDelete: () => void;
};

const itemClass =
  "flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-800";

export function ScenarioMenu({ title, canDelete, onDuplicate, onReset, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <circle cx="4" cy="10" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="16" cy="10" r="1.75" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className={itemClass}
          >
            Duplicate
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onReset();
            }}
            className={itemClass}
          >
            Reset to defaults
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canDelete}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={`${itemClass} text-rose-600 dark:text-rose-400`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
