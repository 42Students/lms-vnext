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
      <Button variant={variant} loading={loading} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      {disabled || loading
        ? <Button variant="secondary" size="icon" disabled aria-label={menuLabel} className="min-h-11 min-w-11 md:min-h-9 md:min-w-9">
            <span aria-hidden="true">▾</span>
          </Button>
        : <Dropdown align="end" label={menuLabel} triggerClassName="min-h-11 min-w-11 md:min-h-9 md:min-w-9" trigger={<span aria-hidden="true">▾</span>}>
            {menu}
          </Dropdown>}
    </div>
  );
}
