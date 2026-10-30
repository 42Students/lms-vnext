"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Refresh the current (possibly filtered/paginated) inbox from the source.
 * A same-URL Link can reuse the cached failed RSC payload. */
export function FacultyNotificationsRetry() {
  const router = useRouter();
  return <Button type="button" size="sm" variant="secondary"
    className="ml-2 min-h-11 md:min-h-9" onClick={() => router.refresh()}>
    Retry notifications
  </Button>;
}
