"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";

export default function DepartmentsError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("Could not load departments", error); }, [error]);
  return <section className="space-y-4" role="alert">
    <PageHeader title="Departments" />
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Could not load departments</h2>
      <p className="mt-2 text-sm text-body">We couldn&apos;t load departments. Please try again.</p>
      <button type="button" onClick={reset}
        className="mt-3 min-h-10 rounded-md border border-border px-4 font-semibold text-primary-text">Retry</button>
    </div>
  </section>;
}
