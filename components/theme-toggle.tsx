"use client";

import type { MouseEvent, ReactNode } from "react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// light/dark lang, walang "system" option
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark"]} disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      setTheme(next);
      return;
    }
    // new theme spreads out in a circle from the button
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const root = document.documentElement;
    root.style.setProperty("--theme-x", `${left + width / 2}px`);
    root.style.setProperty("--theme-y", `${top + height / 2}px`);
    root.dataset.themeSwitch = "";
    const vt = document.startViewTransition(() => {
      // flip the class right away so the snapshot has the new colors; next-themes then saves it
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      setTheme(next);
    });
    vt.finished.finally(() => delete root.dataset.themeSwitch);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {/* icons swap via the .dark class, so server and client render the same markup */}
      <Moon className="size-[1.15rem] dark:hidden" aria-hidden />
      <Sun className="hidden size-[1.15rem] dark:block" aria-hidden />
      <span className="sr-only">Switch between light and dark mode</span>
    </button>
  );
}
