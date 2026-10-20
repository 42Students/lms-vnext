"use client";
import { Button } from "@/components/ui/button";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {Dropdown} from "@/components/ui/dropdown";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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

  return <Disclosure ariaLabel="Create batch" title={<h2 className="m-0 text-lg font-semibold text-foreground">Create batch</h2>} className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
    {programs.length === 0 || periods.length === 0
      ? <p role="status" className="mt-2 text-sm text-muted-foreground">
        {programs.length === 0 ? "Create a program before adding batches." : <>
          Create a usable academic period before adding batches.{" "}
          <Link href="/college/academics" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Set up academic periods</Link>
        </>}
      </p>
      : <form onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Select required value={programId} onChange={e => setProgramId(e.target.value)}
            className="min-h-11 md:min-h-9 ">
            <option value="">Choose program</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start academic period
          <Select required value={startPeriodId} onChange={e => setStartPeriodId(e.target.value)}
            className="min-h-11 md:min-h-9 ">
            <option value="">Choose period</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch name
          <Input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code
          <Input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Expected end period (optional)
          <Select disabled={pending} value={expectedEndPeriodId} onChange={e => setExpectedEndPeriodId(e.target.value)}
            className="min-h-11 md:min-h-9 ">
            <option value="">Not specified</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic Year
          <Input maxLength={16} value={academicYear} onChange={e=>setAcademicYear(e.target.value)}
            placeholder="2026–2027" className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date
          <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date
          <Input type="date" value={endDate} min={startDate||undefined} onChange={e=>setEndDate(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        <div className="md:col-span-2 xl:col-span-3 text-sm text-body">
          <p>Start Date: {start?.startDate??"Choose start period"} · End Date: {end?.endDate??"Not specified"}</p>
          <p>Academic Year: {year?`${year}–${year+1}`:"Select a start period to see the academic year."}</p>
          {dateInvalid?<p role="alert" className="text-error">End date cannot be before start date.</p>:null}
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Button variant="primary" disabled={pending||dateInvalid} type="submit" className="w-full md:w-auto"
            >
            {pending ? "Creating…" : "Create batch"}
          </Button>
        </div>
      </form>}
    {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
  </Disclosure>;
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
        await apiFetch("/api/college/batches/" + encodeURIComponent(row.id) + "/graduate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        });
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
        await apiFetch("/api/college/batches/"+encodeURIComponent(row.id),{
          method:"DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:new Date(row.updatedAt).toISOString(),confirm:true}),
        });
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

  return <div className="min-w-0">
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
    <Button variant="secondary" type="button" disabled={pending || blocked}
      onClick={() => { setEditing(true);setDiscardConfirm(false);setPendingLifecycleAction(null);setNotice(""); }}
      >
      Edit
    </Button>
    <Dropdown trigger="More" label="Batch lifecycle actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
      <div className="grid min-w-0 gap-[var(--lms-space-2)]">
    {row.status === "ACTIVE" && <Button role="menuitem" variant="secondary" type="button"
      disabled={pending || !row.currentTermNumber || (row.durationTerms !== undefined && row.currentTermNumber < row.durationTerms)}
      onClick={graduate}
      >
      Mark graduated
    </Button>}
    <Button role="menuitem" variant="secondary" type="button" disabled={pending || row.status!=="PLANNED" ||
        row.activeSections>0 || row.activeEnrolledLearners>0} onClick={retire}
      title={row.activeSections>0 || row.activeEnrolledLearners>0
        ? `Move or remove its ${row.activeSections} classes and ${row.activeEnrolledLearners} students before deleting.`
        : row.status!=="PLANNED" ? "Only planned batches can be removed." : "Remove this unlinked planned batch"}
      >
      Remove
    </Button>
      </div>
    </Dropdown>
    </div>
    <ConfirmDialog open={Boolean(pendingLifecycleAction)}
      onOpenChange={next=>{if(!next)setPendingLifecycleAction(null);}}
      title={pendingLifecycleAction==="GRADUATE"?"Mark this batch graduated?":"Remove this planned batch?"}
      description={pendingLifecycleAction==="GRADUATE"
        ? `Mark "${row.name}" graduated? This completes the batch after its final registered semester.`
        : `Remove planned batch "${row.name}"? It will be archived, not physically deleted.`}
      confirmLabel={pendingLifecycleAction==="GRADUATE"?"Mark graduated":"Remove batch"}
      pending={pending} onConfirm={pendingLifecycleAction==="GRADUATE"?graduate:retire}/>
    {blocked ? <p className="mt-1 text-xs text-muted-foreground">
      &quot;Archived batches cannot be edited.&quot;
    </p> : null}
    {editing ? <Dialog open={editing} onOpenChange={next=>{if(!next)close();}}
      title={"Edit batch " + row.name}>
      <form onSubmit={save} className="space-y-3">
        
        <p className="text-sm text-muted-foreground">Program and starting period cannot change after creation.</p>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch name
          <Input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code
          <Input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Expected end period
          <Select value={expectedEndPeriodId} onChange={e => setExpectedEndPeriodId(e.target.value)}
            className="min-h-11 md:min-h-9 ">
            <option value="">Not specified</option>
            {row.expectedEndPeriodId && !periods.some(p => p.id === row.expectedEndPeriodId) ?
              <option value={row.expectedEndPeriodId}>Previously recorded period (unavailable)</option> : null}
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic Year
          <Input maxLength={16} value={academicYear} onChange={e=>setAcademicYear(e.target.value)} className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date
          <Input type="date" disabled={endDateLocked} value={startDate} onChange={e=>setStartDate(e.target.value)} className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date
          <Input type="date" disabled={endDateLocked} value={endDate} min={startDate||undefined} onChange={e=>setEndDate(e.target.value)} className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        {endDateLocked && <p className="text-xs text-muted-foreground">
          End period is locked because the batch has enrolled learners or classes. Name and code remain editable.
        </p>}
        {notice ? <p role="alert" className="text-sm text-body">{notice}</p> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={pending} type="button" onClick={close}
            >
            Cancel
          </Button>
          <Button variant="primary" disabled={pending || !hasUnsavedCollegeCohortEdit(original, draft)} type="submit"
            >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog> : null}
    <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
      title="Discard unsaved batch changes?"
      description="The changes to this batch will be lost."
      confirmLabel="Discard changes" pending={pending}
      onConfirm={()=>{setDiscardConfirm(false);setEditing(false);setNotice("");}}/>
    {!editing && notice ? <p role="status" className="mt-1 text-xs text-body">{notice}</p> : null}
  </div>;
}
