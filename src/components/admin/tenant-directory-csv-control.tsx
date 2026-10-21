"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CollegeBulkImport } from "@/components/admin/college-bulk-import";
export function TenantDirectoryCsvControl({ href,organizations }: { href: string; organizations:readonly {id:string;name:string}[] }) {
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
  async function download() {
    if (pending) return;
    setPending(true); setError(null);
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok || !response.headers.get("Content-Type")?.startsWith("text/csv"))
        throw new Error("Export unavailable. Refresh your scope and filters, then retry.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "tenant-directory-ist.csv"; document.body.appendChild(anchor);
      try { anchor.click(); } finally { anchor.remove(); }
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not export tenants."); }
    finally { setPending(false); }
  }
  return <div className="space-y-2 print:hidden"><Button size="sm" variant="secondary" className="min-h-11 md:min-h-9" loading={pending} disabled={pending} onClick={() => void download()}>
    {pending ? "Preparing CSV…" : "Export filtered CSV (max 1,000)"}</Button>
    {error ? <Alert tone="error" className="max-w-sm">{error}</Alert> : null}
    <CollegeBulkImport organizations={organizations}/>
  </div>;
}
