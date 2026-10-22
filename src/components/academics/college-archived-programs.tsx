"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CollegeArchivedPrograms({ programs }: {
  programs: readonly { id: string; name: string; code: string; departmentName: string }[];
}) {
  const {askConfirm,dialog}=useConfirmFlow();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  return <section aria-label="Archived programs" className="min-w-0 border-t border-border pt-4">
    <Button variant="ghost" type="button" onClick={() => setOpen(value => !value)}
      className="w-full justify-between font-[650] text-primary-text md:w-auto">
      {open ? "Hide archived programs" : "Show archived programs"} ({programs.length}{programs.length === 100 ? "+" : ""})
    </Button>
    {open ? <div className="mt-3 space-y-3">
      {programs.length === 0 ? <EmptyState title="No archived programs" description="No archived programs are available for restoration in active departments."/> : programs.map(program => <div key={program.id}
        className="flex min-w-0 flex-col items-stretch gap-3 border-t border-border pt-3 md:flex-row md:items-center md:justify-between">
        <p className="min-w-0 break-words text-sm text-body">{program.name} ({program.code}) · {program.departmentName}</p>
        <Button variant="secondary" type="button" disabled={busy}
          className="w-full rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-[650] text-primary-text md:w-auto"
          onClick={async () => {
            if (pendingRef.current || busy) return;
            if (!(await askConfirm(`Restore ${program.name}? Its active name and code must remain unique.`))) return;
            if (pendingRef.current) return;
            pendingRef.current = true;
            setError("");
            start(async () => {
              try {
                const response = await fetch(
                  "/api/academics/programs/" + encodeURIComponent(program.id),
                  { method: "PATCH", headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "RESTORE", confirm: true }) },
                );
                if (!response.ok) throw new Error("Restore denied: program is stale, its department is inactive or name/code conflicts.");
                router.refresh();
              } catch {
                setError("Could not restore this program. Refresh its department and name before trying again.");
              } finally {
                pendingRef.current = false;
              }
            });
          }}>Restore</Button>
      </div>)}
      {programs.length === 100 ? <p className="text-xs text-muted-foreground">
        Showing the first 100 archived programs. More may exist.
      </p> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}
    </div> : null}
    {dialog}
  </section>;
}
