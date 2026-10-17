"use client";

/**
 * GR-30: const { run, pending, busyLabel } = useGuardedAction();
 * <button disabled={pending} onClick={() => void run(() => save())}>
 *   {pending ? busyLabel : "Save"}
 * </button>
 * A synchronous ref lock prevents both double clicks and Enter-repeat.
 */
import { useCallback, useRef, useState } from "react";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";

export function useGuardedAction(options: {
  timeoutMs?: number;
  busyLabel?: string;
} = {}) {
  const { timeoutMs = 30_000, busyLabel = "Saving..." } = options;
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setPending(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(FRIENDLY_MESSAGES.timeout)),
          Math.max(1, timeoutMs),
        );
      });
      return await Promise.race([operation(), timeout]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      inFlight.current = false;
      setPending(false);
    }
  }, [timeoutMs]);

  return { run, pending, busyLabel };
}
