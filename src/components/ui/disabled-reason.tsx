"use client";

/**
 * GR-36: a disabled native action is not tabbable, so focus its explanation
 * wrapper instead. Enabled actions keep their own single tab stop.
 */
import { cloneElement, Fragment, isValidElement, useId, type ReactNode } from "react";

type DescribedAction = {
  disabled?: boolean;
  "aria-describedby"?: string;
};

export function DisabledReason({ reason, children }: { reason: string; children: ReactNode }) {
  const id = useId();
  const action = isValidElement<DescribedAction>(children) && children.type !== Fragment
    ? children : null;
  const disabled = action?.props.disabled === true;
  const existing = action?.props["aria-describedby"]?.trim() ?? "";
  const describedBy = [...new Set([...existing.split(/\s+/).filter(Boolean), id])].join(" ");
  const control = action ? cloneElement(action, { "aria-describedby": describedBy }) : children;
  return (
    <span data-slot="disabled-reason" className="inline-flex min-w-0 flex-col gap-[var(--lms-space-1)] rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" title={reason}
      role={disabled ? "group" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? 0 : undefined}
      aria-describedby={disabled ? id : undefined}>
      {control}
      <span id={id} className="text-[12px] leading-[18px] text-[var(--lms-muted-text)]">{reason}</span>
    </span>
  );
}
