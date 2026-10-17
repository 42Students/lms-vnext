"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createCollegeCohortSchema,
  hasUnsavedCollegeCohortEdit,
  updateCollegeCohortSchema,
} from "@/modules/academics/college-cohort-mutation-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

type Option = { id: string; name: string; code: string; startDate?:string; endDate?:string };
type Batch = {
  id: string;
  name: string;
  code: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  expectedEndPeriodId: string | null;
  updatedAt: Date;
  activeSections: number;
  activeEnrolledLearners: number;
  currentTermNumber: number | null;
  durationTerms?: number;
};

async function send(method: "POST" | "PATCH", url: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data && typeof data === "object" && "error" in data
      ? String(data.error) : "BATCH_REQUEST_FAILED";
    throw new Error(error);
  }
}

export function CollegeCohortCreateForm({ programs, periods }: {
  programs: Option[]; periods: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [programId, setProgramId] = useState("");
  const [startPeriodId, setStartPeriodId] = useState("");
  const [expectedEndPeriodId, setExpectedEndPeriodId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const start=periods.find(period=>period.id===startPeriodId);
  const end=periods.find(period=>period.id===expectedEndPeriodId);
  const dateInvalid=Boolean(start&&end&&end.endDate&&start.startDate&&end.endDate<start.startDate);
  const year=start?.startDate?Number(start.startDate.slice(0,4)):null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if(dateInvalid){setNotice("End date cannot be before start date.");return;}
    const parsed = createCollegeCohortSchema.safeParse({
      programId, startPeriodId, expectedEndPeriodId: expectedEndPeriodId || null,
      name, code,
    });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Enter valid batch details.");
      return;
    }
    if (!window.confirm("Create this batch in the selected program and academic period?")) return;
    startTransition(async () => {
      try {
        await send("POST", "/api/college/batches", parsed.data);
        setName("");
        setCode("");
        setExpectedEndPeriodId("");
        setNotice("Batch created.");
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Batch creation failed."));
      }
    });
  }

  return <section aria-label="Create batch" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
    <h2 className="m-0 text-lg font-semibold text-foreground">Create batch</h2>
    {programs.length === 0 || periods.length === 0
      ? <p role="status" className="mt-2 text-sm text-muted-foreground">
        {programs.length === 0 ? "Create a program before adding batches." : "Create a usable academic period before adding batches."}
      </p>
      : <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="grid gap-1 text-sm font-medium text-body">Program
          <select required value={programId} onChange={e => setProgramId(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Choose program</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Start academic period
          <select required value={startPeriodId} onChange={e => setStartPeriodId(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Choose period</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Batch name
          <input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Batch code
          <input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Expected end period (optional)
          <select disabled={pending} value={expectedEndPeriodId} onChange={e => setExpectedEndPeriodId(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Not specified</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-5 text-sm text-body">
          <p>Start Date: {start?.startDate??"Choose start period"} · End Date: {end?.endDate??"Not specified"}</p>
          <p>Academic Year: {year?`${year}–${year+1}`:"Select a start period to see the academic year."}</p>
          {dateInvalid?<p role="alert" className="text-error">End date cannot be before start date.</p>:null}
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <button disabled={pending||dateInvalid} type="submit"
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50">
            {pending ? "Creating…" : "Create batch"}
          </button>
        </div>
      </form>}
    {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
  </section>;
}

export function CollegeCohortRowActions({ row, periods }: {
  row: Batch; periods: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [expectedEndPeriodId, setExpectedEndPeriodId] = useState(row.expectedEndPeriodId ?? "");
  const [notice, setNotice] = useState("");
  const original = {
    name: row.name, code: row.code,
    expectedEndPeriodId: row.expectedEndPeriodId,
  };
  const draft = { name, code, expectedEndPeriodId: expectedEndPeriodId || null };
  const blocked = row.status === "ARCHIVED";
  const endDateLocked = row.activeSections > 0 || row.activeEnrolledLearners > 0;

  function graduate() {
    if (!window.confirm(`Mark "${row.name}" graduated? This completes the batch after its final registered semester.`)) return;
    setNotice("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/batches/" + encodeURIComponent(row.id) + "/graduate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? "Graduation failed");
        setNotice("Batch marked graduated.");
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Unable to graduate batch."));
      }
    });
  }
  function retire() {
    if(row.status!=="PLANNED")return;
    if(!window.confirm(`Remove planned batch "${row.name}"? The batch will be archived, not physically deleted. Historical or linked records block this.`))return;
    setNotice("");
    startTransition(async()=>{
      try {
        const response=await fetch("/api/college/batches/"+encodeURIComponent(row.id),{
          method:"DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:new Date(row.updatedAt).toISOString(),confirm:true}),
        });
        if(!response.ok) {
          const payload=await response.json().catch(()=>({error:"BATCH_REMOVAL_FAILED"})) as {error?:string};
          throw new Error(payload.error??"BATCH_REMOVAL_FAILED");
        }
        setNotice("Batch archived; historical identity preserved.");
        router.refresh();
      }catch(error){setNotice(academicSetupErrorMessage(error, "Batch removal failed."));}
    });
  }
  function close() {
    if (hasUnsavedCollegeCohortEdit(original, draft) &&
      !window.confirm("Discard unsaved batch changes?")) return;
    setEditing(false);
    setNotice("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const parsed = updateCollegeCohortSchema.safeParse({ ...draft, confirm: true });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Invalid batch changes.");
      return;
    }
    if (!window.confirm("Save batch changes? Academic identity and existing enrollment links are preserved.")) return;
    startTransition(async () => {
      try {
        await send("PATCH", "/api/college/batches/" + encodeURIComponent(row.id), parsed.data);
        setEditing(false);
        setNotice("Batch updated.");
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Batch update failed."));
      }
    });
  }

  return <div className="min-w-28">
    <div className="flex flex-wrap gap-2">
    <button type="button" disabled={pending || blocked}
      onClick={() => { setEditing(true); setNotice(""); }}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Edit
    </button>
    {row.status === "ACTIVE" && <button type="button"
      disabled={pending || !row.currentTermNumber || (row.durationTerms !== undefined && row.currentTermNumber < row.durationTerms)}
      onClick={graduate}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Mark graduated
    </button>}
    <button type="button" disabled={pending || row.status!=="PLANNED"} onClick={retire}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Remove
    </button>
    </div>
    {blocked ? <p className="mt-1 text-xs text-muted-foreground">
      "Archived batches cannot be edited."
    </p> : null}
    {editing ? <div role="dialog" aria-modal="true" aria-label={"Edit batch " + row.name}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-xl border border-border bg-surface p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">Edit batch</h2>
        <p className="text-sm text-muted-foreground">Program and starting period cannot change after creation.</p>
        <label className="grid gap-1 text-sm font-medium text-body">Batch name
          <input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Batch code
          <input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Expected end period
          <select value={expectedEndPeriodId} onChange={e => setExpectedEndPeriodId(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Not specified</option>
            {row.expectedEndPeriodId && !periods.some(p => p.id === row.expectedEndPeriodId) ?
              <option value={row.expectedEndPeriodId}>Previously recorded period (unavailable)</option> : null}
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </label>
        {endDateLocked && <p className="text-xs text-muted-foreground">
          End period is locked because the batch has enrolled learners or classes. Name and code remain editable.
        </p>}
        {notice ? <p role="alert" className="text-sm text-body">{notice}</p> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <button disabled={pending} type="button" onClick={close}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Cancel
          </button>
          <button disabled={pending || !hasUnsavedCollegeCohortEdit(original, draft)} type="submit"
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div> : null}
    {!editing && notice ? <p role="status" className="mt-1 text-xs text-body">{notice}</p> : null}
  </div>;
}
