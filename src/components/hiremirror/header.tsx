import { Link } from "@tanstack/react-router";
import { ScanSearch } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

/** Slim shared header: logo mark + name on the left, theme toggle on the right. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-lg gradient-brand glow">
            <ScanSearch className="size-4.5 text-primary-foreground" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Hire<span className="text-gradient">Mirror</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
