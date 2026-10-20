"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Button, type ButtonProps } from "./button";
import { Dropdown } from "./dropdown";

/** A primary action and a separate keyboard-accessible actions menu. */
export type SplitButtonProps = {
  label: string;
  onClick: NonNullable<ButtonProps["onClick"]>;
  menu: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
  menuLabel?: string;
};

export function SplitButton({
  label, onClick, menu, disabled = false, loading = false, variant = "primary",
  className, menuLabel = "More actions",
}: SplitButtonProps) {
  return (
    <div data-slot="split-button" role="group" aria-label={label} aria-busy={loading || undefined} aria-disabled={disabled || undefined}
      className={cx("inline-flex min-w-0 max-w-full items-stretch", className)}>
      <Button variant={variant} loading={loading} disabled={disabled} onClick={onClick}
        className="!rounded-r-none focus-visible:!outline-offset-[3px] focus-visible:!outline-[var(--lms-primary-text)]">
        {label}
      </Button>
      {disabled || loading
        ? <Button variant="secondary" size="icon" disabled aria-label={menuLabel} className="min-h-11 min-w-11 !rounded-l-none md:min-h-9 md:min-w-9">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="m6 9 6 6 6-6" /></svg>
          </Button>
        : <Dropdown align="end" label={menuLabel} triggerClassName="min-h-11 min-w-11 !rounded-l-none md:min-h-9 md:min-w-9 focus-visible:!outline-offset-[3px] focus-visible:!outline-[var(--lms-primary-text)]" trigger={<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="m6 9 6 6 6-6" /></svg>}>
            {menu}
          </Dropdown>}
    </div>
  );
}
