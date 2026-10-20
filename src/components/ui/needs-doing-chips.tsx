"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
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
  neutral: "bg-[rgba(0,0,0,0.04)]! text-[var(--lms-neutral-500)]!",
  info: "bg-[rgba(0,0,0,0.04)]! text-[var(--lms-neutral-500)]!",
  success: "bg-[rgba(0,0,0,0.04)]! text-[var(--lms-neutral-500)]!",
  warning: "bg-[rgba(0,0,0,0.04)]! text-[var(--lms-neutral-500)]!",
  error: "bg-[rgba(0,0,0,0.04)]! text-[var(--lms-neutral-500)]!",
} as const;

/** The old LMS's compact "Needs doing:" chips: genuine links or quick filters, never inert buttons. */
export function NeedsDoingChips({ items, selectedKey, onSelect, label = "Needs doing:", className }: NeedsDoingChipsProps) {
  if (!items.length) return null;
  const base = "inline-flex min-h-[36px] max-w-full items-center gap-[8px] rounded-[8px] px-[16px] py-[8px] text-[13px] font-medium! leading-[1.3] transition-colors duration-[var(--lms-motion-fast)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
  return (
    <div data-slot="needs-doing-chips" role="group" aria-label={label.replace(/:$/, "")} className={cx("flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]", className)}>
      <span className="mr-1 text-[13px] font-semibold text-[var(--lms-neutral-500)]">{label}</span>
      {items.map(item => {
        const count = typeof item.count === "number" && Number.isFinite(item.count) ? Math.max(0, Math.trunc(item.count)) : null;
        const selected = selectedKey === item.key;
        const classes = cx(base, (item.href !== undefined || onSelect) && "cursor-pointer hover:brightness-[0.97] max-[767px]:min-h-11", item.disabled && "cursor-not-allowed opacity-50 hover:brightness-100", tones[item.tone ?? "neutral"], selected && "bg-[var(--lms-primary-subtle)]! text-[var(--lms-primary-text)]!");
        const accessibleLabel = count !== null ? `${item.label} ${count}` : item.label;
        const content = <><span>{item.label}</span>{count !== null ? <span className="tabular-nums">{count}</span> : null}</>;
        if (item.href !== undefined) {
          if (!item.disabled && item.href && isSafeInternalHref(item.href)) {
            return <Link key={item.key} href={item.href} data-selected={selected} aria-label={accessibleLabel} aria-current={selected ? "page" : undefined} className={classes}>{content}</Link>;
          }
          return <span key={item.key} aria-disabled="true" className={cx(classes, "cursor-not-allowed opacity-50 hover:brightness-100")}>{content}</span>;
        }
        if (onSelect) {
          return <Button key={item.key} type="button" variant="ghost" size="sm" data-selected={selected} aria-label={accessibleLabel} disabled={item.disabled} aria-pressed={selected} onClick={() => onSelect(item.key)} className={classes}>{content}</Button>;
        }
        return <span key={item.key} aria-disabled={item.disabled || undefined} className={cx(classes, "cursor-default hover:brightness-100")}>{content}</span>;
      })}
    </div>
  );
}
