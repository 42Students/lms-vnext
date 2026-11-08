"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageLoading } from "@/components/ui/page-loading";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/selection-controls";
import { LongText } from "@/components/ui/long-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/ui/stat-tile";

export function UxSharedKitHarness({ page }: { page: number }) {
  const [label, setLabel] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [notice, setNotice] = useState(true);
  const [updates, setUpdates] = useState(false);
  return <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <PageHeader title="Shared UX primitives" description="Synthetic fixture; no live account or database data." />
    <section role="region" aria-label="UX-G164 form and notices" className="space-y-3 rounded-lg border border-border p-4">
      <FormField id="kit-workspace" label="Workspace label" helper="Enter a descriptive label."
        error={invalid ? "Enter a workspace label." : null} required>
        {field => <Input {...field} value={label} onChange={event => {
          setLabel(event.currentTarget.value);
          if (event.currentTarget.value.trim()) setInvalid(false);
        }} />}
      </FormField>
      <Button type="button" onClick={() => setInvalid(!label.trim())}>Validate</Button>
      <Switch label="Email updates" checked={updates}
        onChange={event => setUpdates(event.currentTarget.checked)} />
      {notice ? <InlineNotice tone="error" role="status" message="Synthetic notice: try again."
        onDismiss={() => setNotice(false)} /> : <p role="status">Notice dismissed</p>}
      <LongText value="A very long example filename in an accessible field." />
      <StatusBadge tone="success">Ready</StatusBadge>
      <StatTile label="Example results" value={27} />
    </section>
    <section role="region" aria-label="UX-G164 loading regions" className="space-y-4 rounded-lg border border-border p-4">
      <GracefulPageLoading label="Loading test directory" shape="directory" />
      <PageLoading label="Loading test card" variant="card" count={2} />
    </section>
    <section role="region" aria-label="UX-G164 results pages" className="rounded-lg border border-border p-4">
      <Pagination label="Example results pages" page={page} pageCount={5}
        totalItems={27} pageSize={6} hrefForPage={next => "/e2e/ux-shared-kit?page=" + next} />
    </section>
  </main>;
}
