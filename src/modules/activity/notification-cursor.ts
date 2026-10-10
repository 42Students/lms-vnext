import { z } from "zod";

const cursorSchema = z.object({
  beforeCreatedAt: z.iso.datetime({ offset: true }),
  beforeId: z.string().uuid(),
}).strict();

/** Invalid or incomplete URL cursors are rejected, not silently ignored. */
export function parseNotificationCursor(params: {
  beforeCreatedAt?: string;
  beforeId?: string;
}) {
  if (!params.beforeCreatedAt && !params.beforeId) {
    return { cursor: null, invalid: false } as const;
  }
  const parsed = cursorSchema.safeParse(params);
  if (!parsed.success) {
    return { cursor: null, invalid: true } as const;
  }
  const at = new Date(parsed.data.beforeCreatedAt);
  if (!Number.isFinite(at.getTime())) {
    return { cursor: null, invalid: true } as const;
  }
  return {
    cursor: { beforeCreatedAt: at, beforeId: parsed.data.beforeId },
    invalid: false,
  } as const;
}
