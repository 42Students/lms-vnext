"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const sizes = [10, 25, 50, 100] as const;
const preferenceKey = "lms.college.directory.pageSize";

/** Preserve legacy per-page preference, including all active URL filters. */
export function CollegeDirectoryPageSize({ current }: { current: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("pageSize")) return;
    try {
      const stored = Number(window.localStorage.getItem(preferenceKey));
      if (!sizes.some(size => size === stored) || stored === current) return;
      params.set("pageSize", String(stored));
      params.delete("page");
      router.replace(window.location.pathname + "?" + params.toString(), { scroll: false });
    } catch {
      // Private-mode storage may be unavailable; the server default remains usable.
    }
  }, [current, router]);

  return <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
    Show
    <Select aria-label="Rows per page" value={String(current)} disabled={pending}
      onChange={event => {
        const size = Number(event.target.value);
        if (!sizes.some(value => value === size)) return;
        try { window.localStorage.setItem(preferenceKey, String(size)); } catch {}
        const params = new URLSearchParams(window.location.search);
        params.set("pageSize", String(size));
        params.delete("page");
        startTransition(() => router.push(window.location.pathname + "?" + params.toString(), { scroll: false }));
      }} className="min-h-9 w-[86px]">
      {sizes.map(size => <option key={size} value={size}>{size}</option>)}
    </Select>
    per page
  </label>;
}

export function CollegeDirectoryRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <span className="inline-flex items-center gap-2">
    <Button variant="secondary" type="button" disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-60">
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
    <span aria-live="polite" className="text-xs text-muted-foreground">
      {pending ? "Updating list; current rows remain visible." : ""}
    </span>
  </span>;
}
