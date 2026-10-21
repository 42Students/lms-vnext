"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {useRef,useState,useTransition,type FormEvent} from "react";
import {useToast} from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
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

export function CollegeClassCreate({ cohorts, periods,
 academicSetupHref = "/college/academics",alwaysOpen=true }: {
  cohorts: Cohort[]; periods: Period[]; academicSetupHref?: string;alwaysOpen?:boolean;
}) {
  const router = useRouter();
  const {showToast}=useToast();
  const formRef=useRef<HTMLFormElement>(null);
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const [pending, startTransition] = useTransition();
  const [cohortId, setCohortId] = useState("");
  const [programId,setProgramId]=useState("");
  const [programSearch,setProgramSearch]=useState("");
  const uniquePrograms=[...new Map(cohorts.map(cohort=>[cohort.programId,{id:cohort.programId,name:cohort.programName}])).values()]
    .filter(program=>program.name.toLowerCase().includes(programSearch.trim().toLowerCase()));
  const filteredCohorts=cohorts.filter(cohort=>!programId||cohort.programId===programId);
  const [academicPeriodId, setAcademicPeriodId] = useState(periods.length === 1 ? periods[0]!.id : "");
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
    setNotice("");setFieldErrors({});
    if (!programId) {
      setFieldErrors({programId:"Select program"});setNotice("Select program");
      formRef.current?.querySelector<HTMLSelectElement>('[name="programId"]')?.focus();return;
    }
    if (!cohortId) {
      setFieldErrors({cohortId:"Select batch"});setNotice("Select batch");
      formRef.current?.querySelector<HTMLSelectElement>('[name="cohortId"]')?.focus();return;
    }
    const result = createCollegeSectionSchema.safeParse({
      cohortId, academicPeriodId, name, code:derivedCode, capacity: Number(capacity),
      minSize: minSize === "" ? null : Number(minSize), description: description.trim() || null,
    });
    if (!result.success) {
      const fields=Object.fromEntries(result.error.issues.map(issue=>[String(issue.path[0]),issue.message]));
      setFieldErrors(fields);
      setNotice(result.error.issues[0]?.message ?? "Enter valid class details.");
      const name=String(result.error.issues[0]?.path[0]??"");
      formRef.current?.querySelector<HTMLInputElement>(
        '[name="'+(name==="name"?"className":name)+'"]'
      )?.focus();
      return;
    }
    startTransition(async () => {
      try {
        await requestWrite("POST", "/api/college/classes", result.data);
        setName(""); setCode(""); setDescription("");
        formRef.current?.querySelector<HTMLInputElement>('[name="className"]')?.focus();
        const className=result.data.name;
        setNotice("Class created successfully. Next, register or move students into this section.");
        showToast({tone:"success",title:"Class created successfully",
         description:"Next, register or move students into this section."});
        router.refresh();
      } catch (error) {
        const message = academicSetupErrorMessage(error, "Class creation failed.");
        setNotice(message);
        if (/capacity|maximum|minimum/i.test(message)) setFieldErrors({ capacity: message });
        else if (/batch|cohort/i.test(message)) setFieldErrors({ cohortId: message });
        else if (/period/i.test(message)) setFieldErrors({ academicPeriodId: message });
        else if (/name|section/i.test(message)) setFieldErrors({ name: message });
      }
    });
  }

  return <Disclosure ariaLabel="Create class" defaultOpen={alwaysOpen} title={<h2 className="m-0 text-lg font-semibold text-foreground">Create New Class/Section</h2>}
    className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
    {!cohorts.length || !periods.length
      ? <p role="status" className="mt-2 text-sm text-muted-foreground">
        {!cohorts.length
          ? <>No planned or active batches in this college. <Link href="/college/academics" className="font-semibold underline">Set up programs and batches</Link> first.</>
          : <>No usable academic periods in this college. Create a period first.{" "}
            <Link href={academicSetupHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Set up academic periods</Link>
          </>}
      </p>
      : <form ref={formRef} noValidate onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Input type="search" aria-label="Search programs" placeholder="Search programs" value={programSearch} onChange={event=>setProgramSearch(event.target.value)} className="min-h-9 w-full" />
          <Select required name="programId" aria-invalid={Boolean(fieldErrors.programId)} value={programId} onChange={event=>{setProgramId(event.target.value);setCohortId("");}}
           className="min-h-11 w-full md:min-h-9">
           <option value="">Select program</option>
           {uniquePrograms.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
          {fieldErrors.programId ? <span role="alert" className="text-xs text-red-700">{fieldErrors.programId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
          <Select required name="cohortId" disabled={!programId} aria-invalid={Boolean(fieldErrors.cohortId)} value={cohortId} onChange={event => setCohortId(event.target.value)}
            className="min-h-11 w-full md:min-h-9">
            <option value="">{programId?"Select batch":"Select program first"}</option>
            {filteredCohorts.map(c => <option key={c.id} value={c.id}>
              {c.programName} · {c.name} ({c.code})
            </option>)}
          </Select>
          {fieldErrors.cohortId ? <span role="alert" className="text-xs text-red-700">{fieldErrors.cohortId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period
          <Select required name="academicPeriodId" aria-invalid={Boolean(fieldErrors.academicPeriodId)} value={academicPeriodId}
            onChange={event => setAcademicPeriodId(event.target.value)}
            className="min-h-11 w-full md:min-h-9">
            <option value="">Select period</option>
            {periods.map(p => <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>)}
          </Select>
          {fieldErrors.academicPeriodId ? <span role="alert" className="text-xs text-red-700">{fieldErrors.academicPeriodId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class/Section Name
          <Input required name="className" placeholder="e.g. CSE-A or Section 1" maxLength={255} value={name}
           aria-invalid={Boolean(fieldErrors.name)} onChange={event => setName(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
          {fieldErrors.name ? <span role="alert" className="text-xs text-red-700">{fieldErrors.name}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code (optional; generated from name)
          <Input name="code" maxLength={64} value={code} onChange={event => setCode(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Capacity (required, 1–200)
          <Input required name="capacity" aria-invalid={Boolean(fieldErrors.capacity)} type="number" min={1} max={200} step={1} value={capacity}
            onChange={event => setCapacity(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
          {fieldErrors.capacity ? <span role="alert" className="text-xs text-red-700">{fieldErrors.capacity}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum students (0–200)
          <Input name="minSize" aria-invalid={Boolean(fieldErrors.minSize)} type="number" min={0} max={200} step={1} value={minSize}
            onChange={event => setMinSize(event.target.value)} className="min-h-11 w-full md:min-h-9" />
          {fieldErrors.minSize ? <span role="alert" className="text-xs text-red-700">{fieldErrors.minSize}</span> : null}
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description (optional)
          <Textarea maxLength={2000} rows={2} placeholder="Optional description" value={description} onChange={e => setDescription(e.target.value)}
            className="min-h-24 w-full" />
        </label>
        <p className="text-xs text-muted-foreground md:col-span-2">Moving a student into a full section is refused.</p>
        <div className="flex justify-stretch border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:justify-end">
          <Button variant="primary" disabled={pending} type="submit" className="w-full md:w-auto">
            {pending ? "Creating…" : "+ Create Class & Add Another"}
          </Button>
        </div>
      </form>}
    {notice ? <p role="status" className="mt-[var(--lms-space-3)] max-w-prose break-words text-sm text-body">{notice}</p> : null}
    <p className="mt-2 text-xs text-muted-foreground">
      Class dates follow the batch/semester academic structure. Schedule actual teaching dates from the Schedule action.
    </p>
  </Disclosure>;
}

export function CollegeClassRowActions({ row, cohorts = [], periods = [] }: {
  row: ClassRow; cohorts?: Cohort[]; periods?: Period[];
}) {
  const router = useRouter();
  const {showToast}=useToast();
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
    if (!capacity.trim()) { setNotice("Maximum must be a whole number from 1 to 200"); return; }
    const parsed = updateCollegeSectionSchema.safeParse({ ...draft, confirm: true });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Invalid class changes.");
      return;
    }

    startTransition(async () => {
      try {
        await requestWrite("PATCH", "/api/college/classes/" + encodeURIComponent(row.id), parsed.data);
        setEditing(false); setDiscardConfirm(false);
        setNotice('Updated class “'+row.name+'”.');
        showToast({tone:"success",title:'Updated class “'+row.name+'”.'});
        router.refresh();
      } catch (error) {
        const message=academicSetupErrorMessage(error, "Failed to update class.");
        setNotice(message);
        showToast({tone:"error",title:"Failed to update class.",description:message});
      }
    });
  }

  return <div className="min-w-0">
    <Button variant="secondary" type="button" disabled={pending || row.status !== "ACTIVE"}
      onClick={() => { setEditing(true); setDiscardConfirm(false); setNotice(""); }}
      className="min-h-11 w-full sm:w-auto md:min-h-9" aria-label={"Edit class "+row.name}>
      Edit
    </Button>
    {editing ? <Dialog open={editing} onOpenChange={next=>{if(!next)cancel();}}
      title={'Edit class “'+row.name+'”'} className="max-w-[550px]" dismissible={false}>
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
            <Select value={cohortId} disabled={!programId} onChange={event => setCohortId(event.target.value)} className="min-h-11 md:min-h-9">
              <option value="">{programId?"Select batch":"Select program first"}</option>
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
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class/Section Name
          <Input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code
          <Input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum students (1–200)
          <Input required type="number" min={1} max={200} step={1} value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum students (0–200)
          <Input type="number" min={0} max={200} step={1} value={minSize}
            onChange={e => setMinSize(e.target.value)} className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Description
          <Textarea placeholder="Optional description" rows={2} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
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
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog> : null}
    <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
      title={'Discard edits to “'+row.name+'”?'}
      description="Your unsaved changes will be lost."
      confirmLabel="Discard edits" pending={pending}
      onConfirm={()=>{setDiscardConfirm(false);setEditing(false);setNotice("");}}/>
    {!editing && notice ? <p role="status" className="mt-1 text-xs text-body">{notice}</p> : null}
  </div>;
}
