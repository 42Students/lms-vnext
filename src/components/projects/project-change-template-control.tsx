"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { projectApiError, projectMutation } from "./project-api";

type TemplateOption = { templateId: string; title: string; version: number };

const destructiveWarning =
  "Changing the template replaces this workspace's tasks, sprints and resources with the new template's. " +
  "Edits made to the current ones are not kept. This happens regardless of the checkbox below, " +
  "which only controls whether blank title/summary/overview fields get refilled from the new template.";

export function ProjectChangeTemplateControl({ projectId, status, expectedUpdatedAt }: {
  projectId: string;
  status: string;
  expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [options, setOptions] = useState<TemplateOption[]>([]);
  const [reapplyDefaults, setReapplyDefaults] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchSequence = useRef(0);
  const saving = useRef(false);

  useEffect(() => {
    if (!open) {
      searchSequence.current += 1;
      return;
    }
    const current = ++searchSequence.current;
    const controller = new AbortController();
    async function lookup() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "/api/projects/" + encodeURIComponent(projectId) +
          "/template?search=" + encodeURIComponent(search),
          { method: "GET", credentials: "same-origin", cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error(await projectApiError(response));
        const data: { templates?: TemplateOption[] } = await response.json();
        if (current !== searchSequence.current) return;
        const items = Array.isArray(data.templates) ? data.templates : [];
        setOptions(previous => {
          const kept = previous.find(option => option.templateId === selected);
          return kept && !items.some(option => option.templateId === kept.templateId)
            ? [kept, ...items] : items;
        });
      } catch (caught) {
        if (current !== searchSequence.current || controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Failed to search templates");
      } finally {
        if (current === searchSequence.current) setLoading(false);
      }
    }
    void lookup();
    return () => controller.abort();
  }, [open, projectId, search, selected]);

  function close(next: boolean) {
    if (pending || saving.current) return;
    setOpen(next);
    if (!next) {
      setSelected("");
      setSearch("");
      setAcknowledged(false);
      setReapplyDefaults(true);
      setError(null);
    }
  }

  async function attach() {
    if (saving.current || pending || !selected || !acknowledged) return;
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      const result: { changed?: boolean } = await projectMutation(
        "/api/projects/" + encodeURIComponent(projectId) + "/template", "POST",
        { templateId: selected, expectedUpdatedAt, reapplyDefaults },
      );
      setOpen(false);
      showToast({ tone: "success", title: result.changed ? "Template attached" : "Template already attached" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to attach template");
      showToast({ tone: "error", title: "Failed to attach template",
        description: "The workspace may have active work or linked records. Refresh before retrying." });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  if (!["PLANNED", "ACTIVE"].includes(status)) return null;

  return <>
    <Button size="sm" variant="secondary" onClick={() => close(true)}>
      Change template…
    </Button>
    <Dialog open={open} onOpenChange={close} title="Change template"
      description="Choose a published template assigned to this college."
      dismissible={!pending}>
      <div className="min-w-0 space-y-4">
        <p role="alert" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2 text-sm leading-6 text-body">
          {destructiveWarning}
        </p>
        <p className="text-xs text-body">
          Replacement is blocked if work has started, tasks are assigned or existing records
          depend on the current plan. Nothing is changed if the operation is rejected.
        </p>
        <label className="block text-[13px] font-semibold text-body">
          Search by template title
          <Input className="mt-1" value={search} maxLength={100}
            disabled={pending} placeholder="Search by template title"
            onChange={event => setSearch(event.target.value)} />
        </label>
        <label className="block text-[13px] font-semibold text-body">
          Template
          <Select className="mt-1" disabled={pending || loading && options.length === 0}
            value={selected} onChange={event => setSelected(event.target.value)}>
            <option value="">Select a template</option>
            {options.map(option => <option key={option.templateId} value={option.templateId}>
              {option.title + " (v" + option.version + ")"}
            </option>)}
          </Select>
        </label>
        {loading ? <p role="status" className="text-xs text-body">Searching templates…</p> : null}
        {!loading && !error && !options.length ?
          <p className="text-xs text-body">No published assigned templates matched the search.</p> : null}
        {error ? <p role="alert" className="text-sm font-semibold text-error">{error}</p> : null}
        <label className="flex items-start gap-2 text-sm leading-6 text-body">
          <Checkbox checked={reapplyDefaults} disabled={pending}
            onChange={event => setReapplyDefaults(event.target.checked)} />
          Refill blank title/summary/overview from the new template
        </label>
        <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-body">
          <Checkbox checked={acknowledged} disabled={pending}
            onChange={event => setAcknowledged(event.target.checked)} />
          I understand that unstarted tasks, sprints and resources will be replaced.
        </label>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <Button variant="secondary" disabled={pending} onClick={() => close(false)}>Cancel</Button>
          <Button loading={pending} disabled={pending || !selected || !acknowledged || loading}
            onClick={() => void attach()}>
            {pending ? "Attaching…" : "Attach"}
          </Button>
        </div>
      </div>
    </Dialog>
  </>;
}
