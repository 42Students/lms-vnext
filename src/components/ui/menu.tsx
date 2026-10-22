"use client";

import { type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent } from "react";
import { cx } from "@/lib/class-names";

export type MenuProps = HTMLAttributes<HTMLDivElement>;
export type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Menu({ className, onKeyDown, children, ...props }: MenuProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // Leave caret navigation in search fields untouched, but let Escape
    // close their parent disclosure menu and restore its trigger focus.
    if (event.key !== "Escape" && event.target instanceof Element &&
        event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled):not([aria-disabled="true"]), a[href]:not([aria-disabled="true"])'))
      .filter(item => item.getClientRects().length > 0 && !item.closest("[hidden], [inert], [aria-disabled=\"true\"]"));
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (items.length === 0 && event.key !== "Escape") return;
    let target = current;
    if (event.key === "ArrowDown") target = (current + 1) % items.length;
    else if (event.key === "ArrowUp") target = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = items.length - 1;
    else if (event.key === "Escape") {
      const details = event.currentTarget.closest("details");
      if (details) { details.open = false; details.querySelector("summary")?.focus(); event.preventDefault(); }
      return;
    } else return;
    event.preventDefault();
    items[target]?.focus();
  }
  return <div {...props} data-slot="menu" role="menu" onKeyDown={handleKeyDown}
    className={cx("min-w-0 max-w-full rounded-[var(--lms-control-radius)] bg-white p-[var(--lms-space-1)] shadow-none text-[14px] leading-5 text-[var(--lms-body-text)]", className)}>{children}</div>;
}

const menuItemBaseClass = "flex min-h-11 min-w-0 w-full items-center break-words rounded-[var(--lms-control-radius)] md:min-h-9 px-[var(--lms-space-3)] py-[var(--lms-space-2)] text-left text-[14px] leading-5 transition-[background-color,border-color,box-shadow] duration-[200ms] ease-[ease] hover:bg-[rgba(0,0,0,0.035)] hover:text-[var(--lms-neutral-900)] active:bg-[rgba(0,0,0,0.06)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:active:bg-transparent aria-[checked=true]:bg-[var(--lms-primary)] aria-[checked=true]:text-white aria-[selected=true]:bg-[var(--lms-primary)] aria-[selected=true]:text-white";

export function MenuItem({ className, children, type = "button", ...props }: MenuItemProps) {
  const ariaDisabled = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return <button {...props} type={type} disabled={props.disabled || ariaDisabled} role="menuitem"
    className={cx(menuItemBaseClass, className)}>{children}</button>;
}

/** Legacy menu separator: 1px neutral rule with 6px/8px breathing space. */
export function MenuSeparator() {
  return <div role="separator" aria-orientation="horizontal" className="mx-2 my-1.5 h-px bg-[var(--lms-canvas-border)]" />;
}
