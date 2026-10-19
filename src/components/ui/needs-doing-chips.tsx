"use client";

import Link from "next/link";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

export type NeedsDoingChip = {
  key: string;
  label: string;
  count?: number;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
  href?: string;
  disabled?: boolean;
};
export type NeedsDoingChipsProps = {
  items: readonly NeedsDoingChip[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  label?: string;
  className?: string;
};

const tones = {
  neutral: "border-[var(--lms-canvas-border)] bg-white text-[var(--lms-body-text)]",
  info: "border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "border-[var(--lms-canvas-border)] bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
  warning: "border-[var(--lms-canvas-border)] bg-[var(--lms-warning-subtle)] text-[var(--lms-warning-text)]",
  error: "border-[var(--lms-canvas-border)] bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
} as const;

/** The old LMS's compact "Needs doing:" chips: genuine links or quick filters, never inert buttons. */
export function NeedsDoingChips({ items, selectedKey, onSelect, label = "Needs doing:", className }: NeedsDoingChipsProps) {
  if (!items.length) return null;
  const base = "inline-flex min-h-8 max-w-full items-center gap-[var(--lms-space-2)] rounded-[var(--lms-radius-pill)] border px-[var(--lms-space-4)] py-[var(--lms-space-2)] text-[13px] font-medium leading-[17px] transition-colors duration-[var(--lms-motion-fast)] hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
  return (
    <div data-slot="needs-doing-chips" role="group" aria-label={label.replace(/:$/, "")} className={cx("flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]", className)}>
      <span className="mr-1 text-[13px] font-semibold text-[var(--lms-neutral-500)]">{label}</span>
      {items.map(item => {
        const count = typeof item.count === "number" && Number.isFinite(item.count) ? Math.max(0, Math.trunc(item.count)) : null;
        const selected = selectedKey === item.key;
        const classes = cx(base, tones[item.tone ?? "neutral"], selected && "border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]");
        const accessibleLabel = count !== null ? `${item.label} ${count}` : item.label;
        const content = <><span>{item.label}</span>{count !== null ? <span className="tabular-nums">{count}</span> : null}</>;
        if (item.href !== undefined) {
          if (!item.disabled && item.href && isSafeInternalHref(item.href)) {
            return <Link key={item.key} href={item.href} aria-label={accessibleLabel} aria-current={selected ? "page" : undefined} className={classes}>{content}</Link>;
          }
          return <span key={item.key} aria-disabled="true" className={cx(classes, "cursor-not-allowed opacity-50")}>{content}</span>;
        }
        if (onSelect) {
          return <button key={item.key} type="button" aria-label={accessibleLabel} disabled={item.disabled} aria-pressed={selected} onClick={() => onSelect(item.key)} className={classes}>{content}</button>;
        }
        return <span key={item.key} aria-disabled={item.disabled || undefined} className={cx(classes, "cursor-default hover:brightness-100")}>{content}</span>;
      })}
    </div>
  );
}
