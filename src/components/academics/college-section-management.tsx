"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {
  createCollegeSectionSchema, sectionIdentityChanged,
  updateCollegeSectionSchema,
} from "@/modules/academics/college-section-mutation-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

type Cohort = { id: string; name: string; code: string; programName: string; programId: string };
type Period = { id: string; name: string; code: string };
type ClassRow = {
  id: string; name: string; code: string;
  cohortId: string; academicPeriodId: string;
  capacity: number | null; minSize: number | null; description?: string | null; status: "ACTIVE" | "ARCHIVED"; activeLearners: number | null;
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

export function CollegeClassCreate({ cohorts, periods, academicSetupHref = "/college/academics" }: {
  cohorts: Cohort[]; periods: Period[]; academicSetupHref?: string;
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
  const [minSize, setMinSize] = useState("0");
  const [description, setDescription] = useState("");
  const derivedCode=code.trim()||name.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,64);
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");
    const result = createCollegeSectionSchema.safeParse({
      cohortId, academicPeriodId, name, code:derivedCode, capacity: Number(capacity),
      minSize: minSize === "" ? null : Number(minSize), description: description.trim() || null,
    });
    if (!result.success) {
      setNotice(result.error.issues[0]?.message ?? "Enter valid class details.");
      return;
    }
    startTransition(async () => {
      try {
        await requestWrite("POST", "/api/college/classes", result.data);
        setName(""); setCode(""); setCapacity("60"); setMinSize("0"); setDescription("");
        setNotice("Class created.");
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, "Class creation failed."));
      }
    });
  }

  return <Disclosure ariaLabel="Create class" title={<h2 className="m-0 text-lg font-semibold text-foreground">Create class</h2>}
    className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
    {!cohorts.length || !periods.length
      ? <p role="status" className="mt-2 text-sm text-muted-foreground">
        {!cohorts.length
          ? "No planned or active batches in this college. Create a batch first."
          : <>No usable academic periods in this college. Create a period first.{" "}
            <Link href={academicSetupHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Set up academic periods</Link>
          </>}
      </p>
      : <form onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 max-w-[920px] grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Select required value={programId} onChange={event=>{setProgramId(event.target.value);setCohortId("");}}
           className="min-h-11 w-full md:min-h-9">
           <option value="">Select program</option>
           {uniquePrograms.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
          <Select required value={cohortId} onChange={event => setCohortId(event.target.value)}
            className="min-h-11 w-full md:min-h-9">
            <option value="">Select batch</option>
            {filteredCohorts.map(c => <option key={c.id} value={c.id}>
              {c.programName} · {c.name} ({c.code})
            </option>)}
          </Select>
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period
          <Select required value={academicPeriodId}
            onChange={event => setAcademicPeriodId(event.target.value)}
            className="min-h-11 w-full md:min-h-9">
            <option value="">Select period</option>
            {periods.map(p => <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>)}
          </Select>
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class name
          <Input required maxLength={255} value={name} onChange={event => setName(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code (optional; generated from name)
          <Input maxLength={64} value={code} onChange={event => setCode(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Capacity (required, 1–200)
          <Input required type="number" min={1} max={200} step={1} value={capacity}
            onChange={event => setCapacity(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum students (0–200)
          <Input type="number" min={0} max={200} step={1} value={minSize}
            onChange={event => setMinSize(event.target.value)} className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description (optional)
          <Textarea maxLength={2000} rows={2} value={description} onChange={e => setDescription(e.target.value)}
            className="min-h-24 w-full" />
        </label>
        <p className="text-xs text-muted-foreground md:col-span-2">Moving a student into a full section is refused.</p>
        <div className="flex justify-stretch border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:justify-end">
          <Button variant="primary" disabled={pending} type="submit" className="w-full md:w-auto">
            {pending ? "Creating…" : "Create class"}
          </Button>
        </div>
      </form>}
    {notice ? <p role="status" className="mt-[var(--lms-space-3)] max-w-prose break-words text-sm text-body">{notice}</p> : null}
    <p className="mt-2 text-xs text-muted-foreground">
      The server validates that the period belongs to the batch timeline and this college.
    </p>
  </Disclosure>;
}

export function CollegeClassRowActions({ row, cohorts = [], periods = [] }: {
  row: ClassRow; cohorts?: Cohort[]; periods?: Period[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [capacity, setCapacity] = useState(row.capacity === null ? "" : String(row.capacity));
  const [minSize, setMinSize] = useState(row.minSize === null ? "" : String(row.minSize));
  const [cohortId, setCohortId] = useState(row.cohortId);
  const [academicPeriodId, setAcademicPeriodId] = useState(row.academicPeriodId);
  const [programId, setProgramId] = useState(cohorts.find(c => c.id === row.cohortId)?.programId ?? "");
  const programs = [...new Map(cohorts.map(c => [c.programId, { id: c.programId, name: c.programName }])).values()];
  const [description, setDescription] = useState(row.description ?? "");
  const [notice, setNotice] = useState("");
  const draft = { name, code, capacity: capacityInput(capacity),
    minSize: minSize.trim() === "" ? null : Number(minSize),
    cohortId, academicPeriodId, description: description.trim() || null };
  const changed = sectionIdentityChanged(row, draft) || row.capacity !== draft.capacity ||
    row.minSize !== draft.minSize || row.cohortId !== cohortId ||
    row.academicPeriodId !== academicPeriodId || (row.description ?? null) !== draft.description;

  function cancel() {
    if (changed && !discardConfirm) { setDiscardConfirm(true); return; }
    setDiscardConfirm(false); setEditing(false); setNotice("");
    setName(row.name); setCode(row.code); setCapacity(row.capacity === null ? "" : String(row.capacity));
    setMinSize(row.minSize === null ? "" : String(row.minSize));
    setCohortId(row.cohortId); setAcademicPeriodId(row.academicPeriodId);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
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

  return <div className="min-w-0">
    <Button variant="secondary" type="button" disabled={pending || row.status !== "ACTIVE"}
      onClick={() => { setEditing(true); setDiscardConfirm(false); setNotice(""); }}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      Edit
    </Button>
    {editing ? <Dialog open={editing} onOpenChange={next=>{if(!next)cancel();}}
      title={"Edit class " + row.name}>
      <form onSubmit={save} className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
        
        <p className="text-sm text-muted-foreground md:col-span-2">
          Reassigning a batch, program or academic period requires no dependent students, schedules,
          faculty assignments or course deliveries. The server checks college and period scope.
        </p>
        {cohorts.length > 0 ? <>
          <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground">Program
            <Select value={programId} onChange={event => {
              setProgramId(event.target.value);
              const first = cohorts.find(c => c.programId === event.target.value);
              setCohortId(first?.id ?? "");
            }} className="min-h-11 md:min-h-9">
              <option value="">Select program</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </label>
          <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground">Batch
            <Select value={cohortId} onChange={event => setCohortId(event.target.value)} className="min-h-11 md:min-h-9">
              <option value="">Select batch</option>
              {cohorts.filter(c => !programId || c.programId === programId).map(c =>
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </label>
        </> : null}
        {periods.length > 0 ? <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground md:col-span-2">Academic period
          <Select value={academicPeriodId} onChange={event => setAcademicPeriodId(event.target.value)}
            className="min-h-11 md:min-h-9">
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label> : null}
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class name
          <Input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code
          <Input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Capacity (blank means unlimited)
          <Input type="number" min={1} max={200} step={1} value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum students (0–200)
          <Input type="number" min={0} max={200} step={1} value={minSize}
            onChange={e => setMinSize(e.target.value)} className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Description
          <Textarea rows={2} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
            className="min-h-24 w-full" />
        </label>
        <p className="text-xs text-muted-foreground md:col-span-2">Active learner enrollments: {row.activeLearners === null ? "Unavailable" : row.activeLearners}.</p>
        {notice ? <p role="alert" className="text-sm text-body md:col-span-2">{notice}</p> : null}
        <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          <Button variant="secondary" disabled={pending} type="button" onClick={cancel}
            >
            Cancel
          </Button>
          <Button variant="primary" disabled={pending || !changed} type="submit"
            >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog> : null}
    <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
      title="Discard unsaved class changes?"
      description="The changes to this class will be lost."
      confirmLabel="Discard changes" pending={pending}
      onConfirm={()=>{setDiscardConfirm(false);setEditing(false);setNotice("");}}/>
    {!editing && notice ? <p role="status" className="mt-1 text-xs text-body">{notice}</p> : null}
  </div>;
}
