"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function DepartmentsError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("Could not load departments", error); }, [error]);
  return <section className="space-y-4" role="alert">
    <PageHeader title="Departments" />
    <div className="border-t border-border pt-5">
      <h2 className="text-lg font-semibold text-foreground">Could not load departments</h2>
      <p className="mt-2 text-sm text-body">We couldn&apos;t load departments. Please try again.</p>
      <Button type="button" variant="secondary" onClick={reset} className="mt-3">Retry</Button>
    </div>
  </section>;
}
