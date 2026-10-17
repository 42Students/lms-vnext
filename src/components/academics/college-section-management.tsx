"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import {
  createCollegeSectionSchema, sectionIdentityChanged,
  updateCollegeSectionSchema,
} from "@/modules/academics/college-section-mutation-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

type Cohort = { id: string; name: string; code: string; programName: string; programId: string };
type Period = { id: string; name: string; code: string };
type ClassRow = {
  id: string; name: string; code: string;
  capacity: number | null; description?: string | null; status: "ACTIVE" | "ARCHIVED"; activeLearners: number;
};

async function requestWrite(method: "POST" | "PATCH", url: string, input: unknown) {
  await apiFetch(url, {
    method, headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

function capacityInput(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function CollegeClassCreate({ cohorts, periods }: {
  cohorts: Cohort[]; periods: Period[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cohortId, setCohortId] = useState("");
  const [programId,setProgramId]=useState("");
  const uniquePrograms=[...new Map(cohorts.map(cohort=>[cohort.programId,{id:cohort.programId,name:cohort.programName}])).values()];
  const filteredCohorts=cohorts.filter(cohort=>!programId||cohort.programId===programId);
  const [academicPeriodId, setAcademicPeriodId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("60");
  const [description, setDescription] = useState("");
  const derivedCode=code.trim()||name.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,64);
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const result = createCollegeSectionSchema.safeParse({
      cohortId, academicPeriodId, name, code:derivedCode, capacity: Number(capacity), description: description.trim() || null,
    });
    if (!result.success) {
      setNotice(result.error.issues[0]?.message ?? "Enter valid class details.");
      return;
    }
    startTransition(async () => {
      try {
        await requestWrite("POST", "/api/college/classes", result.data);
        setName(""); setCode(""); setCapacity("60"); setDescription("");
        setNotice("Class created.");
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Class creation failed."));
      }
    });
  }

  return <section aria-label="Create class" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
    <h2 className="m-0 text-lg font-semibold text-foreground">Create class</h2>
    {!cohorts.length || !periods.length
      ? <p role="status" className="mt-2 text-sm text-muted-foreground">
        {!cohorts.length
          ? "No planned or active batches in this college. Create a batch first."
          : <>No usable academic periods in this college. Create a period first.{" "}
            <Link href="/college/academics" className="font-semibold text-primary-text underline">Set up academic periods</Link>
          </>}
      </p>
      : <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="grid gap-1 text-sm font-medium text-body">Program
          <select required value={programId} onChange={event=>{setProgramId(event.target.value);setCohortId("");}}
           className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
           <option value="">Select program</option>
           {uniquePrograms.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Batch
          <select required value={cohortId} onChange={event => setCohortId(event.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Select batch</option>
            {filteredCohorts.map(c => <option key={c.id} value={c.id}>
              {c.programName} · {c.name} ({c.code})
            </option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Academic period
          <select required value={academicPeriodId}
            onChange={event => setAcademicPeriodId(event.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">Select period</option>
            {periods.map(p => <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Class name
          <input required maxLength={255} value={name} onChange={event => setName(event.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Class code (optional; generated from name)
          <input maxLength={64} value={code} onChange={event => setCode(event.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Capacity (required, 1–200)
          <input required type="number" min={1} max={200} step={1} value={capacity}
            onChange={event => setCapacity(event.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body sm:col-span-2 lg:col-span-5">Description (optional)
          <textarea maxLength={2000} rows={2} value={description} onChange={e => setDescription(e.target.value)}
            className="rounded-md border border-border bg-surface p-3 text-foreground" />
        </label>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-5">Moving a student into a full section is refused.</p>
        <div className="sm:col-span-2 lg:col-span-5">
          <button disabled={pending} type="submit"
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50">
            {pending ? "Creating…" : "Create class"}
          </button>
        </div>
      </form>}
    {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
    <p className="mt-2 text-xs text-muted-foreground">
      The server validates that the period belongs to the batch timeline and this college.
    </p>
  </section>;
}

export function CollegeClassRowActions({ row }: { row: ClassRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [capacity, setCapacity] = useState(row.capacity === null ? "" : String(row.capacity));
  const [description, setDescription] = useState(row.description ?? "");
  const [notice, setNotice] = useState("");
  const draft = { name, code, capacity: capacityInput(capacity), description: description.trim() || null };
  const changed = sectionIdentityChanged(row, draft) || row.capacity !== draft.capacity || (row.description ?? null) !== draft.description;

  function cancel() {
    if (changed && !discardConfirm) { setDiscardConfirm(true); return; }
    setDiscardConfirm(false); setEditing(false); setNotice("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const parsed = updateCollegeSectionSchema.safeParse({ ...draft, confirm: true });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Invalid class changes.");
      return;
    }

    startTransition(async () => {
      try {
        await requestWrite("PATCH", "/api/college/classes/" + encodeURIComponent(row.id), parsed.data);
        setEditing(false); setDiscardConfirm(false); setNotice("Class updated.");
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Class update failed."));
      }
    });
  }

  return <div>
    <button type="button" disabled={pending || row.status !== "ACTIVE"}
      onClick={() => { setEditing(true); setDiscardConfirm(false); setNotice(""); }}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Edit
    </button>
    {editing ? <div role="dialog" aria-modal="true" aria-label={"Edit class " + row.name}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-xl border border-border bg-surface p-5 shadow-lg">
        <h2 className="m-0 text-lg font-semibold text-foreground">Edit class</h2>
        <p className="text-sm text-muted-foreground">
          Batch and academic period are immutable. Name and code changes require no dependent records.
        </p>
        <label className="grid gap-1 text-sm font-medium text-body">Class name
          <input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Class code
          <input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Capacity (blank means unlimited)
          <input type="number" min={1} max={10000} step={1} value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Description
          <textarea rows={2} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
            className="rounded-md border border-border bg-surface p-3 text-foreground" />
        </label>
        <p className="text-xs text-muted-foreground">Active learner enrollments: {row.activeLearners}.</p>
        {notice ? <p role="alert" className="text-sm text-body">{notice}</p> : null}
        {discardConfirm?<div role="group" aria-label="Discard unsaved class changes?" className="rounded-md border border-border bg-muted p-3 text-sm">
          <p>Discard unsaved class changes?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending} onClick={cancel} className="rounded bg-primary px-3 py-2 font-semibold text-on-primary">Discard changes</button>
            <button type="button" onClick={()=>setDiscardConfirm(false)} className="rounded border border-border px-3 py-2">Keep editing</button>
          </div>
        </div>:null}
        <div className="flex justify-end gap-2">
          <button disabled={pending} type="button" onClick={cancel}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Cancel
          </button>
          <button disabled={pending || !changed} type="submit"
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div> : null}
    {!editing && notice ? <p role="status" className="mt-1 text-xs text-body">{notice}</p> : null}
  </div>;
}
