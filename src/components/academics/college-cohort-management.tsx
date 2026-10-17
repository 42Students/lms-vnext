"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
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
  academicYear:string|null;startDate:string|null;endDate:string|null;
  updatedAt: Date;
  activeSections: number;
  activeEnrolledLearners: number;
  currentTermNumber: number | null;
  durationTerms?: number;
};

async function send(method: "POST" | "PATCH", url: string, body: unknown) {
  await apiFetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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
  const [academicYear,setAcademicYear]=useState("");
  const [startDate,setStartDate]=useState("");
  const [endDate,setEndDate]=useState("");
  const [notice, setNotice] = useState("");
  const start=periods.find(period=>period.id===startPeriodId);
  const end=periods.find(period=>period.id===expectedEndPeriodId);
  const dateInvalid=Boolean((startDate||start?.startDate)&&(endDate||end?.endDate)&&
    (endDate||end?.endDate||"")<(startDate||start?.startDate||""));
  const year=start?.startDate?Number(start.startDate.slice(0,4)):null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if(dateInvalid){setNotice("End date cannot be before start date.");return;}
    const parsed = createCollegeCohortSchema.safeParse({
      programId, startPeriodId, expectedEndPeriodId: expectedEndPeriodId || null,
      name, code,academicYear:academicYear||null,startDate:startDate||null,endDate:endDate||null,
    });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Enter valid batch details.");
      return;
    }
    startTransition(async () => {
      try {
        await send("POST", "/api/college/batches", parsed.data);
        setName("");
        setCode("");
        setAcademicYear("");setStartDate("");setEndDate("");
        setExpectedEndPeriodId("");
        setNotice(`Created batch “${parsed.data.name}”. Next, create its classes/sections.`);
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
        {programs.length === 0 ? "Create a program before adding batches." : <>
          Create a usable academic period before adding batches.{" "}
          <Link href="/college/academics" className="font-semibold text-primary-text underline">Set up academic periods</Link>
        </>}
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
        <label className="grid gap-1 text-sm font-medium text-body">Academic Year
          <input maxLength={16} value={academicYear} onChange={e=>setAcademicYear(e.target.value)}
            placeholder="2026–2027" className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">Start Date
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label>
        <label className="grid gap-1 text-sm font-medium text-body">End Date
          <input type="date" value={endDate} min={startDate||undefined} onChange={e=>setEndDate(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
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
  const [discardConfirm,setDiscardConfirm]=useState(false);
  const [pendingLifecycleAction,setPendingLifecycleAction]=useState<"GRADUATE"|"RETIRE"|null>(null);
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [expectedEndPeriodId, setExpectedEndPeriodId] = useState(row.expectedEndPeriodId ?? "");
  const [academicYear,setAcademicYear]=useState(row.academicYear??"");
  const [startDate,setStartDate]=useState(row.startDate??"");
  const [endDate,setEndDate]=useState(row.endDate??"");
  const [notice, setNotice] = useState("");
  const original = {
    name: row.name, code: row.code,
    expectedEndPeriodId: row.expectedEndPeriodId,
    academicYear:row.academicYear,startDate:row.startDate,endDate:row.endDate,
  };
  const draft = { name, code, expectedEndPeriodId: expectedEndPeriodId || null,
    academicYear:academicYear||null,startDate:startDate||null,endDate:endDate||null };
  const blocked = row.status === "ARCHIVED";
  const endDateLocked = row.activeSections > 0 || row.activeEnrolledLearners > 0;

  function graduate() {
    if(pendingLifecycleAction!=="GRADUATE") {setPendingLifecycleAction("GRADUATE");return;}
    setPendingLifecycleAction(null);setNotice("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/batches/" + encodeURIComponent(row.id) + "/graduate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? "Graduation failed");
        setNotice(`Marked “${row.name}” as graduated (Completed).`);
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Unable to graduate batch."));
      }
    });
  }
  function retire() {
    if(row.status!=="PLANNED")return;
    if(pendingLifecycleAction!=="RETIRE") {setPendingLifecycleAction("RETIRE");return;}
    setPendingLifecycleAction(null);setNotice("");
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
    if (hasUnsavedCollegeCohortEdit(original, draft) && !discardConfirm) {setDiscardConfirm(true);return;}
    setDiscardConfirm(false);setEditing(false);
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

    startTransition(async () => {
      try {
        await send("PATCH", "/api/college/batches/" + encodeURIComponent(row.id), parsed.data);
        setEditing(false);setDiscardConfirm(false);
        setNotice(`Updated batch “${parsed.data.name}”.`);
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Batch update failed."));
      }
    });
  }

  return <div className="min-w-28">
    <div className="flex flex-wrap gap-2">
    <button type="button" disabled={pending || blocked}
      onClick={() => { setEditing(true);setDiscardConfirm(false);setPendingLifecycleAction(null);setNotice(""); }}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Edit
    </button>
    {row.status === "ACTIVE" && <button type="button"
      disabled={pending || !row.currentTermNumber || (row.durationTerms !== undefined && row.currentTermNumber < row.durationTerms)}
      onClick={graduate}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Mark graduated
    </button>}
    <button type="button" disabled={pending || row.status!=="PLANNED" ||
        row.activeSections>0 || row.activeEnrolledLearners>0} onClick={retire}
      title={row.activeSections>0 || row.activeEnrolledLearners>0
        ? `Move or remove its ${row.activeSections} classes and ${row.activeEnrolledLearners} students before deleting.`
        : row.status!=="PLANNED" ? "Only planned batches can be removed." : "Remove this unlinked planned batch"}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Remove
    </button>
    </div>
    {pendingLifecycleAction?<div role="group" aria-label="Confirm batch lifecycle" className="mt-2 space-y-2 rounded border border-border bg-muted p-3 text-xs">
      <p>{pendingLifecycleAction==="GRADUATE"
        ? `Mark "${row.name}" graduated? This completes the batch after its final registered semester.`
        : `Remove planned batch "${row.name}"? The batch will be archived, not physically deleted. Historical or linked records block this.`}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={pendingLifecycleAction==="GRADUATE"?graduate:retire}
          className="rounded bg-primary px-3 py-2 font-semibold text-on-primary">Confirm</button>
        <button type="button" disabled={pending} onClick={()=>setPendingLifecycleAction(null)}
          className="rounded border border-border px-3 py-2">Cancel</button>
      </div>
    </div>:null}
    {blocked ? <p className="mt-1 text-xs text-muted-foreground">
      &quot;Archived batches cannot be edited.&quot;
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
        <label className="grid gap-1 text-sm">Academic Year
          <input maxLength={16} value={academicYear} onChange={e=>setAcademicYear(e.target.value)} className="min-h-10 rounded border border-border bg-surface px-3"/>
        </label>
        <label className="grid gap-1 text-sm">Start Date
          <input type="date" disabled={endDateLocked} value={startDate} onChange={e=>setStartDate(e.target.value)} className="min-h-10 rounded border border-border bg-surface px-3"/>
        </label>
        <label className="grid gap-1 text-sm">End Date
          <input type="date" disabled={endDateLocked} value={endDate} min={startDate||undefined} onChange={e=>setEndDate(e.target.value)} className="min-h-10 rounded border border-border bg-surface px-3"/>
        </label>
        {endDateLocked && <p className="text-xs text-muted-foreground">
          End period is locked because the batch has enrolled learners or classes. Name and code remain editable.
        </p>}
        {notice ? <p role="alert" className="text-sm text-body">{notice}</p> : null}
        {discardConfirm?<div role="group" aria-label="Discard unsaved batch changes?" className="space-y-2 rounded border border-border bg-muted p-3 text-sm">
          <p>Discard unsaved batch changes?</p>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={close} className="rounded bg-primary px-3 py-2 font-semibold text-on-primary">Discard changes</button>
            <button type="button" onClick={()=>setDiscardConfirm(false)} className="rounded border border-border px-3 py-2">Keep editing</button>
          </div>
        </div>:null}
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
