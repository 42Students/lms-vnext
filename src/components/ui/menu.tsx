"use client";

import { type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent } from "react";
import { cx } from "@/lib/class-names";

export type MenuProps = HTMLAttributes<HTMLDivElement>;
export type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Menu({ className, onKeyDown, children, ...props }: MenuProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // Leave caret navigation inside embedded search fields untouched.
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled):not([aria-disabled="true"]), a[href]:not([aria-disabled="true"])'));
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
    className={cx("min-w-44 rounded-[6px] bg-white p-[var(--lms-space-1)] shadow-none text-[14px] leading-5 text-[var(--lms-body-text)]", className)}>{children}</div>;
}

export function MenuItem({ className, children, type = "button", ...props }: MenuItemProps) {
  const ariaDisabled = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return <button {...props} type={type} disabled={props.disabled || ariaDisabled} role="menuitem"
    className={cx("flex min-h-11 w-full items-center rounded-[8px] px-[var(--lms-space-3)] py-[var(--lms-space-2)] text-left text-[14px] leading-5 transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50", className)}>{children}</button>;
}
