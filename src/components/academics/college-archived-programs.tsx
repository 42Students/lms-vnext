"use client";
import { Button } from "@/components/ui/button";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CollegeArchivedPrograms({ programs }: {
  programs: readonly { id: string; name: string; code: string; departmentName: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  return <section className="border-t border-border pt-4">
    <Button variant="ghost" type="button" onClick={() => setOpen(value => !value)}
      className="font-semibold text-primary-text">
      {open ? "Hide archived programs" : "Show archived programs"} ({programs.length}{programs.length === 100 ? "+" : ""})
    </Button>
    {open ? <div className="mt-3 space-y-3">
      {programs.length === 0 ? <p className="text-sm text-body">
        No archived programs are available for restoration in active departments.
      </p> : programs.map(program => <div key={program.id}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-sm text-body">{program.name} ({program.code}) · {program.departmentName}</p>
        <Button variant="secondary" type="button" disabled={busy}
          className="text-primary-text"
          onClick={() => {
            if (!window.confirm(`Restore ${program.name}? Its active name and code must remain unique.`)) return;
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
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "Restore failed");
              }
            });
          }}>Restore</Button>
      </div>)}
      {programs.length === 100 ? <p className="text-xs text-muted-foreground">
        Showing the first 100 archived programs. More may exist.
      </p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </div> : null}
  </section>;
}
