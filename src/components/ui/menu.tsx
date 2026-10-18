"use client";

import { type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent } from "react";
import { cx } from "@/lib/class-names";

export type MenuProps = HTMLAttributes<HTMLDivElement>;
export type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Menu({ className, onKeyDown, children, ...props }: MenuProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)'));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let target = current;
    if (event.key === "ArrowDown") target = (current + 1) % items.length;
    else if (event.key === "ArrowUp") target = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = items.length - 1;
    else if (event.key === "Escape") {
      const details = event.currentTarget.closest("details");
      if (details) { details.open = false; details.querySelector("summary")?.focus(); event.preventDefault(); }
      return;
    } else return;
    if (!items.length) return;
    event.preventDefault();
    items[target]?.focus();
  }
  return <div {...props} data-slot="menu" role="menu" onKeyDown={handleKeyDown}
    className={cx("min-w-44 rounded-[9px] bg-white p-1 text-[14px] leading-5 text-[#54505d]", className)}>{children}</div>;
}

export function MenuItem({ className, children, type = "button", ...props }: MenuItemProps) {
  return <button {...props} type={type} role="menuitem"
    className={cx("flex min-h-9 w-full items-center rounded-[6px] px-3 py-2 text-left text-[14px] leading-5 transition-colors duration-150 hover:bg-[#eff8fa] hover:text-[#1a95a1] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#26bac7] disabled:cursor-not-allowed disabled:opacity-50", className)}>{children}</button>;
}
