"use client";

import { useSyncExternalStore } from "react";
import { secondaryButton } from "@/components/ui/styles";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function readIsDark() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, readIsDark, () => false);

  function toggle() {
    const next = !readIsDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      return;
    }
  }

  return (
    <button type="button" onClick={toggle} className={`${secondaryButton} whitespace-nowrap px-3 py-1.5 text-xs`}>
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
