"use client";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FileUpload } from "@/components/ui/file-upload";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

export function UxKitActionsHarness() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("No action applied");
  const [filename, setFilename] = useState("None");
  return <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
    <Breadcrumbs items={[{label:"Home",href:"/dashboard"},{label:"Shared UI"}]}/>
    <PageHeader title="Shared interactions" description="Development-only test data" />
    <section role="region" aria-label="UX-G163 controls" className="space-y-4">
      <Card title="Accessible account control">
        <Avatar name="Anjali Kumar" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="bare" loading={loading} onClick={() => setOutcome("Disallowed double submit")}>Save action</Button>
          <Button variant="secondary" onClick={() => setLoading(false)}>Enable action</Button>
          <Button variant="danger" onClick={() => setOpen(true)}>Delete example</Button>
        </div>
        <p role="status">{outcome}</p>
      </Card>
      <FilterBar title="Search only" search={<Input aria-label="Search records" type="search" />} />
      <FilterBar title="Filters" activeCount={1}
        search={<Input aria-label="Search with filters" type="search"/>}
        filters={<label className="flex flex-col gap-2">Status <select aria-label="Status" defaultValue="open">
          <option value="open">Open</option><option value="closed">Closed</option>
        </select></label>}/>
      <Card title="Upload preview">
        <FileUpload id="ux-g163-file" label="Proof file" accept=".pdf" maxBytes={10}
          helper="PDF, up to ten bytes." showSelectedFiles onFiles={files=>setFilename(files?.[0]?.name ?? "None")} />
        <p role="status">Chosen file: {filename}</p>
      </Card>
      <EmptyState title="No recent records" description="Review filters before trying again." />
      <ErrorState role="status" description="Example recovery route" retryHref="/dashboard"/>
    </section>
    <ConfirmDialog open={open} title="Delete example?" description="This is synthetic."
      onOpenChange={setOpen} onConfirm={() => {setOutcome("Example deleted");setOpen(false);}} />
  </main>;
}
