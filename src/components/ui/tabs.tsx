"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type TabItem = { value: string; label: string; content?: ReactNode; disabled?: boolean };
export type TabsProps = {
  items: readonly TabItem[];
  value: string;
  onValueChange: (next: string) => void;
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
  const selected = items.find(item => item.value === value && !item.disabled);
  function keyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = -1;
    if (event.key === "ArrowRight") target = tabNextEnabled(items, index, 1);
    else if (event.key === "ArrowLeft") target = tabNextEnabled(items, index, -1);
    else if (event.key === "Home") target = items.findIndex(item => !item.disabled);
    else if (event.key === "End") target = items.findLastIndex(item => !item.disabled);
    if (target < 0) return;
    event.preventDefault();
    const item = items[target];
    if (!item) return;
    onValueChange(item.value);
    buttons.current[target]?.focus();
  }
  return (
    <div className={cx("min-w-0", className)} data-slot="tabs">
      <div role="tablist" aria-label={ariaLabel} className="flex min-w-0 gap-2 overflow-x-auto border-b border-border pb-1">
        {items.map((item, index) => (
          <button key={item.value} ref={node => { buttons.current[index] = node; }}
            id={`${id}-tab-${index}`} type="button" role="tab"
            aria-controls={renderPanel ? `${id}-panel` : undefined}
            aria-selected={item.value === value}
            disabled={item.disabled}
            tabIndex={item.value === value ? 0 : -1}
            onKeyDown={event => keyDown(event, index)}
            onClick={() => onValueChange(item.value)}
            className={cx("inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap border-b-2 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:opacity-50",
              item.value === value ? "border-[var(--lms-teal-deep)] text-foreground" : "border-transparent text-body hover:bg-primary-subtle")}>
            {item.label}
          </button>
        ))}
      </div>
      {renderPanel ? <section id={`${id}-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-tab-${items.findIndex(item => item.value === value)}`} className="min-w-0 pt-4">{selected?.content}</section> : null}
    </div>
  );
}
