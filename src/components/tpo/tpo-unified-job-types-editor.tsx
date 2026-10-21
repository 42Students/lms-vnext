"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { InlineNotice } from "@/components/ui/inline-notice";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { useToast } from "@/components/ui/toast";

export type EditableJobType = {
  id: string | null;
  label: string;
  isBuiltin: boolean;
  countsAsPlaced: boolean;
  active: boolean;
  drives: number;
  expectedVersion: string;
};
type Row = EditableJobType & { key: string };
const NAME = /^[\p{L}\p{N} +&\/().,'-]{2,40}$/u;
const normalize = (value: string) => value.trim().replace(/\s+/g, " ");
const snapshot = (items: readonly Row[]) => JSON.stringify(items.map(
  ({ id, label, isBuiltin, countsAsPlaced, active, expectedVersion }) =>
    ({ id, label, isBuiltin, countsAsPlaced, active, expectedVersion }),
));
const fromProps = (items: readonly EditableJobType[]): Row[] =>
  items.map((item, i) => ({ ...item, key: item.id ?? "builtin-" + i }));

/** Legacy Settings > Job types: one ordered, staged five-column table and one atomic save. */
export function TpoUnifiedJobTypesEditor({ types }: { types: readonly EditableJobType[] }) {
  const router = useRouter();
  const {showToast} = useToast();
  const serial = useRef(0);
  const [rows, setRows] = useState<Row[]>(() => fromProps(types));
  const [saved, setSaved] = useState<Row[]>(() => fromProps(types));
  const [newName, setNewName] = useState("");
  const [newPlaced, setNewPlaced] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { askConfirm, dialog } = useConfirmFlow();
  const dirty = snapshot(rows) !== snapshot(saved);

  useEffect(() => {
    setRows(fromProps(types));
    setSaved(fromProps(types));
  }, [types]);
  useEffect(() => {
    if (!dirty) return;
    const preventExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventExit);
    return () => window.removeEventListener("beforeunload", preventExit);
  }, [dirty]);

  const activeCount = rows.filter(row => row.active).length;
  const normalizedNewName = normalize(newName);
  const duplicate = (name: string, key: string) => rows.some(
    row => row.key !== key && normalize(row.label).toLowerCase() === normalize(name).toLowerCase(),
  );
  function nameProblem(name: string, key: string) {
    const normalized = normalize(name);
    if (!NAME.test(normalized)) return "2-40 letters, digits or simple punctuation";
    if (duplicate(normalized, key)) return '"' + normalized + '" is already a job type';
    return "";
  }
  function edit(key: string, patch: Partial<EditableJobType>) {
    setRows(current => current.map(row => row.key === key ? { ...row, ...patch } : row));
    setMessage("");
  }
  function add() {
    if (busy || newPlaced === null || rows.filter(row => !row.isBuiltin).length >= 30 ||
        nameProblem(normalizedNewName, "new")) return;
    const key = "new-" + (++serial.current);
    setRows(current => [...current, { key, id: null, label: normalizedNewName,
      isBuiltin: false, active: true, countsAsPlaced: newPlaced, drives: 0,
      expectedVersion: "none" }]);
    setNewName("");
    setNewPlaced(null);
    setError("");
    setMessage("");
  }
  function remove(key: string) {
    setRows(current => current.filter(row => row.key !== key));
    setMessage("");
  }
  async function save() {
    if (busy || !dirty) return;
    for (const row of rows) {
      if (row.isBuiltin) continue;
      const problem = nameProblem(row.label, row.key);
      if (problem) { setError('"' + row.label + '": ' + problem); return; }
    }
    if (!rows.some(row => row.active)) {
      setError("Keep at least one job type switched on");
      return;
    }
    const flipped = rows.filter(row => {
      const previous = saved.find(old => old.id && old.id === row.id);
      return previous && previous.drives > 0 && previous.countsAsPlaced !== row.countsAsPlaced;
    });
    const renamed = rows.filter(row => {
      const previous = saved.find(old => old.id && old.id === row.id);
      return previous && previous.drives > 0 && normalize(previous.label) !== normalize(row.label);
    });
    if (flipped.length || renamed.length) {
      const impact = [
        ...flipped.map(row => row.label + ": offers from its " + row.drives +
          (row.drives === 1 ? " drive" : " drives") + " will " +
          (row.countsAsPlaced ? "now count" : "no longer count") +
          " as placed. Placed % and reports change with it."),
        ...renamed.map(row => {
          const before = saved.find(old => old.id === row.id)!;
          return '"' + before.label + '" becomes "' + normalize(row.label) +
            '" on its ' + before.drives + (before.drives === 1 ? " drive" : " drives") +
            ", where students see it.";
        }),
      ];
      const approved = await askConfirm((flipped.length ?
        "Change what counts as placed?" : "Rename on drives too?") + "\n" + impact.join("\n"));
      if (!approved) return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/placements/tpo/settings/job-types", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows.map(row => ({
          id: row.id, label: normalize(row.label), isBuiltin: row.isBuiltin,
          countsAsPlaced: row.countsAsPlaced, active: row.active,
          expectedVersion: row.expectedVersion,
        }))),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        const copy: Record<string, string> = {
          TPO_JOB_TYPE_EXISTS: "A job type name is already in use.",
          TPO_JOB_TYPE_LIMIT: "Up to 30 job types of your own",
          TPO_JOB_TYPE_LAST_ACTIVE: "Keep at least one job type switched on",
          TPO_JOB_TYPE_IN_USE: "Used by drives: switch it off instead",
          TPO_SETTINGS_STALE: "Job types changed. Refresh and retry.",
        };
        throw new Error(copy[payload.error ?? ""] ?? payload.error ?? "Could not save job types");
      }
      setSaved(rows.map(row => ({ ...row, label: normalize(row.label) })));
      setMessage("Job types saved");
      showToast({tone:"success",title:"Job types saved"});
      router.refresh();
    } catch (caught) {
      const detail=caught instanceof Error ? caught.message : "Could not save job types";
      setError(detail);
      showToast({tone:"error",title:"Job types were not saved",description:detail});
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-w-0 space-y-4" data-testid="settings.job-types">
    {dialog}
    <p className="text-sm text-muted-foreground">
      The drive form, filters and reports use this list. Switching a type off hides it from new drives; drives that already have it keep it.
    </p>
    {dirty ? <span role="status" className="inline-flex rounded-[var(--lms-control-radius)] border border-[var(--lms-warning-border)] px-2 py-1 text-xs font-semibold text-warning">Unsaved changes</span> : null}
    <div className="max-w-full overflow-x-auto rounded-[var(--lms-control-radius)] border border-border">
      <div role="table" aria-label="Job types" className="min-w-[740px]">
        <div role="row" className="grid grid-cols-[minmax(190px,2fr)_minmax(145px,1fr)_80px_135px_64px] gap-3 border-b border-border bg-[var(--lms-neutral-50)] px-3 py-2 text-xs font-semibold">
          <span role="columnheader">Job type</span>
          <span role="columnheader">Counts as placed</span>
          <span role="columnheader">Drives</span>
          <span role="columnheader">In the drive form</span>
          <span role="columnheader" aria-label="Remove" />
        </div>
        {rows.map(row => <div key={row.key} role="row"
          className={"grid grid-cols-[minmax(190px,2fr)_minmax(145px,1fr)_80px_135px_64px] items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0" +
            (row.active ? "" : " opacity-60")}>
          <div role="cell" className="min-w-0">
            {row.isBuiltin ? <span>{row.label} <span className="rounded border border-border bg-[var(--lms-neutral-50)] px-1.5 py-0.5 text-xs">Built-in</span></span> :
              <Input aria-label={"Name of " + row.label} maxLength={40} value={row.label} disabled={busy}
                aria-invalid={Boolean(nameProblem(row.label, row.key))}
                onChange={event => edit(row.key, { label: event.target.value })}/>}
          </div>
          <div role="cell">
            {row.isBuiltin ? (row.countsAsPlaced ? "Yes" : "No") :
              <div role="radiogroup" aria-label={row.label + " counts as placed"} className="flex gap-3">
                <label className="inline-flex items-center gap-1"><Radio name={"counts-" + row.key} checked={row.countsAsPlaced}
                  disabled={busy} onChange={() => edit(row.key, { countsAsPlaced: true })}/>Yes</label>
                <label className="inline-flex items-center gap-1"><Radio name={"counts-" + row.key} checked={!row.countsAsPlaced}
                  disabled={busy} onChange={() => edit(row.key, { countsAsPlaced: false })}/>No</label>
              </div>}
          </div>
          <span role="cell">{row.drives}</span>
          <div role="cell">
            <Checkbox role="switch" aria-label={row.label + " in the drive form"} checked={row.active}
              disabled={busy || (row.active && activeCount <= 1)}
              onChange={event => edit(row.key, { active: event.target.checked })}/>
          </div>
          <div role="cell">
            {!row.isBuiltin ? <Button type="button" variant="ghost" size="sm"
              aria-label={"Remove " + row.label}
              title={row.drives > 0 ? "Used by drives: switch it off instead" : "Remove"}
              disabled={busy || row.drives > 0} onClick={() => remove(row.key)}>
              <Trash2 aria-hidden="true" size={16}/></Button> : null}
          </div>
        </div>)}
      </div>
    </div>
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Add a job type</h3>
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-[220px] max-w-full">
          <Input aria-label="New job type" value={newName} maxLength={40}
            placeholder="e.g. Part-time" disabled={busy}
            aria-invalid={Boolean(newName.trim() && nameProblem(newName, "new"))}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }}
            onChange={event => setNewName(event.target.value)}/>
          {newName.trim() && nameProblem(newName, "new") ?
            <p role="alert" className="text-xs text-error">{nameProblem(newName, "new")}</p> : null}
        </div>
        <fieldset className="space-y-1 text-sm">
          <legend>Does an offer of this type count as placed?</legend>
          <div role="radiogroup" aria-label="New type counts as placed" className="flex gap-3">
            <label className="inline-flex items-center gap-1"><Radio name="new-counts" checked={newPlaced === true}
              disabled={busy} onChange={() => setNewPlaced(true)}/>Yes</label>
            <label className="inline-flex items-center gap-1"><Radio name="new-counts" checked={newPlaced === false}
              disabled={busy} onChange={() => setNewPlaced(false)}/>No</label>
          </div>
        </fieldset>
        <Button type="button" variant="secondary" onClick={add}
          disabled={busy || !normalizedNewName || !!nameProblem(newName, "new") || newPlaced === null ||
            rows.filter(row => !row.isBuiltin).length >= 30}>
          <Plus size={15} aria-hidden="true"/> Add
        </Button>
      </div>
    </section>
    {error ? <div className="space-y-2">
      <InlineNotice tone="error" message={"Job types were not saved. " + error} onDismiss={() => setError("")}/>
      <Button type="button" size="sm" variant="secondary" onClick={() => void save()} disabled={busy}>Retry</Button>
    </div> : null}
    {message ? <InlineNotice tone="success" message={message} onDismiss={() => setMessage("")}/> : null}
    <p className="rounded-[var(--lms-control-radius)] border border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] p-3 text-sm">
      Internship never counts as placed; Internship + full-time counts once the full-time offer is made. Your own types follow the answer you give.
    </p>
    <div className="flex justify-end">
      <Button type="button" onClick={() => void save()} disabled={busy || !dirty}>
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </div>
  </div>;
}
