/**
 * GR-36: disabled actions remain understandable and keyboard discoverable.
 * Usage: <DisabledReason reason="Complete your profile first.">
 *   <Button disabled>Submit</Button>
 * </DisabledReason>
 */
import { useId, type ReactNode } from "react";

export function DisabledReason({ reason, children }: { reason: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="inline-flex min-w-0 flex-col gap-1" title={reason}>
      <span aria-describedby={id}>{children}</span>
      <span id={id} className="text-xs text-muted-foreground">{reason}</span>
    </span>
  );
}
