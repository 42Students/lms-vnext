"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import Link from "next/link";
import { isSafeInternalHref } from "@/lib/safe-internal-href";
import { ScrollCue } from "@/components/ui/scroll-cue";

export type TabItem = { value: string; label: string; content?: ReactNode; disabled?: boolean; href?: string };
export type TabsProps = {
  items: readonly TabItem[];
  value: string;
  onValueChange?: (next: string) => void;
  ariaLabel: string;
  className?: string;
  renderPanel?: boolean;
};

export function tabNextEnabled(items: readonly Pick<TabItem, "disabled">[], current: number, direction: 1 | -1) {
  if (!items.length) return -1;
  for (let step = 1; step <= items.length; step++) {
    const index = (current + direction * step + items.length * (step + 1)) % items.length;
    if (!items[index]?.disabled) return index;
  }
  return -1;
}

export function Tabs({ items, value, onValueChange, ariaLabel, className, renderPanel = true }: TabsProps) {
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const interactive = renderPanel && typeof onValueChange === "function";
  // A bookmarked tab can disappear or become disabled when permissions
  // change. Present the first still-enabled panel with ONE valid tab stop.
  const preferredIndex = items.findIndex(item => item.value === value && !item.disabled);
  const activeIndex = preferredIndex >= 0 ? preferredIndex : items.findIndex(item => !item.disabled);
  const selected = activeIndex >= 0 ? items[activeIndex] : undefined;
  function keyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!interactive) return;
    let target = -1;
    if (event.key === "ArrowRight") target = tabNextEnabled(items, index, 1);
    else if (event.key === "ArrowLeft") target = tabNextEnabled(items, index, -1);
    else if (event.key === "Home") target = items.findIndex(item => !item.disabled);
    else if (event.key === "End") target = items.findLastIndex(item => !item.disabled);
    if (target < 0) return;
    event.preventDefault();
    const item = items[target];
    if (!item) return;
    if (interactive) onValueChange?.(item.value);
    buttons.current[target]?.focus();
  }
  return (
    <div className={cx("min-w-0", className)} data-slot="tabs">
      {renderPanel ? <ScrollCue axis="x" label={`${ariaLabel} tabs`}><div role="tablist" aria-label={ariaLabel} className="flex min-w-max gap-5 border-b border-border pb-0">
        {items.map((item, index) => (
          <button key={item.value} ref={node => { buttons.current[index] = node; }}
            id={`${id}-tab-${index}`} type="button" role="tab"
            aria-controls={renderPanel ? `${id}-panel` : undefined}
            aria-selected={index === activeIndex}
            disabled={item.disabled || !interactive}
            aria-disabled={item.disabled || !interactive || undefined}
            tabIndex={interactive && index === activeIndex ? 0 : -1}
            onKeyDown={event => keyDown(event, index)}
            onClick={() => { if (interactive) onValueChange?.(item.value); }}
            className={cx("inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap border-b-[3px] px-0 transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] motion-reduce:transition-none text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:opacity-50",
              index === activeIndex ? "border-[var(--lms-primary)] text-primary-text" : "border-transparent text-body hover:bg-transparent hover:text-primary-text")}>
            {item.label}
          </button>
        ))}
      </div></ScrollCue> : <ScrollCue axis="x" label={`${ariaLabel} navigation`}><nav aria-label={ariaLabel} className="flex min-w-max gap-2 border-b border-border pb-1">
        {items.map(item => item.disabled || !item.href || !isSafeInternalHref(item.href) ? <span key={item.value} aria-disabled="true" className="inline-flex min-h-9 items-center whitespace-nowrap border-b-[3px] border-transparent px-4 text-sm text-body opacity-60">{item.label}</span> : <Link key={item.value} href={item.href} aria-current={item.value === value ? "page" : undefined}
            className={cx("inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap border-b-[3px] px-0 text-[13px] leading-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]",
              item.value === value ? "border-[var(--lms-primary)] text-primary-text" : "border-transparent text-body hover:bg-transparent hover:text-primary-text")}>
              {item.label}</Link>)}
      </nav></ScrollCue>}
      {renderPanel ? <section id={`${id}-panel`} role="tabpanel" tabIndex={0} aria-labelledby={activeIndex >= 0 ? `${id}-tab-${activeIndex}` : undefined} className="min-w-0 pt-4">{selected?.content}</section> : null}
    </div>
  );
}
