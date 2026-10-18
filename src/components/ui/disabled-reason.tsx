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
    <span className="inline-flex min-w-0 flex-col gap-1" title={reason}
      role={disabled ? "group" : undefined}
      tabIndex={disabled ? 0 : undefined}
      aria-describedby={disabled ? id : undefined}>
      {control}
      <span id={id} className="text-xs text-muted-foreground">{reason}</span>
    </span>
  );
}
