"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/class-names";
import type { ShellNavItem } from "./shell-model";

export function SidebarNav({
  items,
  compact = false,
}: {
  items: readonly ShellNavItem[];
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className={cx(
        "flex gap-1",
        compact ? "flex-row" : "flex-col",
      )}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "group flex min-h-11 items-center rounded-r-lg border-l-2 px-3 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-[var(--lms-sidebar-active)] text-primary-text"
                : "border-transparent text-body hover:bg-primary-subtle hover:text-primary-text",
              compact ? "gap-2" : "gap-3",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                active
                  ? "bg-primary text-on-primary"
                  : "bg-muted text-muted-foreground group-hover:bg-surface group-hover:text-primary-text",
              )}
            >
              {item.shortLabel}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
