import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type StatTileProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  className?: string;
  variant?: "default" | "college";
  children?: ReactNode;
};

const numberFormat = new Intl.NumberFormat("en-IN");

export function StatTile({ label, value, detail, href, className, variant = "default", children }: StatTileProps) {
  const safeHref = href && isSafeInternalHref(href) ? href : null;
  const displayValue = typeof value === "number"
    ? Number.isFinite(value) ? numberFormat.format(value) : "—"
    : value;
  const content = (
    <>
      <p className={cx("m-0 leading-5", variant === "college" ? "text-xs font-normal text-[rgba(0,0,0,0.45)]" : "text-[13px] font-medium text-[var(--lms-body-text)]")}>{label}</p>
      <p className={cx("mt-2 break-words font-semibold tabular-nums", variant === "college" ? "text-base leading-6 text-[var(--lms-neutral-900)]" : "text-2xl leading-8 text-[var(--lms-heading)] lg:text-3xl lg:leading-9")}>{displayValue}</p>
      {detail ? <p className="mt-2 text-[13px] leading-5 text-[var(--lms-body-text)]">{detail}</p> : null}
      {children}
    </>
  );
  const classes = cx("block min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)] shadow-none sm:p-[var(--lms-canvas-padding)]", safeHref ? "min-h-11 transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none" : "", className);
  const styledClasses = cx(classes, variant === "college" ? "rounded-lg border-[rgba(38,186,199,0.35)] bg-[var(--lms-primary-subtle)] px-4 py-3" : "");
  return safeHref ? <Link href={safeHref} className={styledClasses} data-slot="stat-tile">{content}</Link> :
    <section className={styledClasses} data-slot="stat-tile">{content}</section>;
}
