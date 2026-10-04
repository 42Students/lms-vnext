"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/class-names";
import type { ShellNavItem } from "./shell-model";

export function SidebarNav({
  items,
  compact = false,
  onNavigate,
}: {
  items: readonly ShellNavItem[];
  compact?: boolean;
  onNavigate?: () => void;
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
            onClick={onNavigate}
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
                "flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold",
                item.icon
                  ? ""
                  : active
                    ? "rounded-md bg-primary text-on-primary"
                    : "rounded-md bg-muted text-muted-foreground group-hover:bg-surface group-hover:text-primary-text",
              )}
            >
              {item.icon ? (
                <Image
                  src={active ? item.activeIcon ?? item.icon : item.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                item.shortLabel
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
