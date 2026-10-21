"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** A refresh retains the previous page during Next navigation and never
 * caches another membership's profile. Selected-college authorization stays
 * in the server query, not in client state.
 */
export function TpoProfileRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  return <div className="flex min-w-0 flex-wrap items-center gap-3" aria-busy={pending}>
    <Button type="button" variant="secondary" disabled={pending}
      onClick={() => {
        setNotice("");
        startTransition(() => {
          router.refresh();
          setNotice("Requested the latest profile details. If information is outdated, ask your college administrator.");
        });
      }}>
      {pending ? "Refreshing profile…" : "Refresh profile"}
    </Button>
    {notice ? <p role="status" className="text-xs text-muted-foreground">{notice}</p> : null}
  </div>;
}
