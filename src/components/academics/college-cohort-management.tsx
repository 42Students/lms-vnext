"use client";
import { Button } from "@/components/ui/button";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {Dropdown} from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
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

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function academicYearFor(date: string, startMonth: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const year = Number(date.slice(0, 4));
  const first = Number(date.slice(5, 7)) >= startMonth ? year : year - 1;
  return `${first}-${String((first + 1) % 100).padStart(2, "0")}`;
}

function validAcademicYear(value: string): boolean {
  if (!value.trim()) return true;
  const result = /^(\d{4})-(\d{2})$/.exec(value.trim());
  return Boolean(result && Number(result[2]) === (Number(result[1]) + 1) % 100);
}

function cohortErrors(error: unknown): Record<string, string> {
  if (!(error instanceof FriendlyFetchError)) return {};
  const fields: Record<string, string> = {};
  const aliases: Record<string, string> = {
    batch_name: "name", batchName: "name", name: "name", batch_code: "code",
    program_id: "programId", academic_year: "academicYear",
    start_date: "startDate", end_date: "endDate",
    start_period_id: "startPeriodId", expected_end_period_id: "expectedEndPeriodId",
  };
  for (const [key, value] of Object.entries(error.fieldErrors)) {
    fields[aliases[key] ?? key] = value;
  }
  if (error.code === "BATCH_NAME_CONFLICT") fields.name = "A batch with this name already exists.";
  if (error.code === "BATCH_CODE_CONFLICT") fields.code = "A batch with this code already exists.";
  if (error.code === "BATCH_PERIOD_INVALID") fields.endDate = "End date cannot be before start date";
  return fields;
}

async function send(method: "POST" | "PATCH", url: string, body: unknown) {
  await apiFetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function CollegeCohortCreateForm({ programs, periods, academicSetupHref = "/college/academics" }: {
  programs: Option[]; periods: Option[]; academicSetupHref?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
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
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [startMonth, setStartMonth] = useState(7);
  useEffect(() => {
    if (!programId) { setStartMonth(7); return; }
    try {
      const stored = Number(localStorage.getItem("batch-academic-year-start-month:" + programId));
      setStartMonth(Number.isInteger(stored) && stored >= 1 && stored <= 12 ? stored : 7);
    } catch { setStartMonth(7); }
  }, [programId]);
  const start=periods.find(period=>period.id===startPeriodId);
  const end=periods.find(period=>period.id===expectedEndPeriodId);
  const dateInvalid=Boolean((startDate||start?.startDate)&&(endDate||end?.endDate)&&
    (endDate||end?.endDate||"")<(startDate||start?.startDate||""));
  const yearSource = startDate || start?.startDate || "";
  const suggestedYear = academicYearFor(yearSource, startMonth);
  function startDateChanged(value: string) {
    setStartDate(value);
    if (!academicYear) setAcademicYear(academicYearFor(value || start?.startDate || "", startMonth));
    setFieldErrors(current => ({ ...current, startDate: "", endDate: "" }));
  }
  function startPeriodChanged(value: string) {
    setStartPeriodId(value);
    const next = periods.find(period => period.id === value);
    if (!academicYear) setAcademicYear(academicYearFor(startDate || next?.startDate || "", startMonth));
    setFieldErrors(current => ({ ...current, startPeriodId: "" }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice(""); setNoticeIsError(false); setFieldErrors({});
    if (!programId) { setFieldErrors({ programId: "Select a program" }); return; }
    if (!startPeriodId) { setFieldErrors({ startPeriodId: "Select a starting academic period" }); return; }
    if (!name.trim()) { setFieldErrors({ name: "Enter a batch name" }); return; }
    if (name.length > 255) { setFieldErrors({ name: "Maximum 255 characters" }); return; }
    if (!code.trim()) { setFieldErrors({ code: "Enter a batch code" }); return; }
    if (!validAcademicYear(academicYear)) {
      setFieldErrors({ academicYear: "Use consecutive years, e.g., 2026-27" }); return;
    }
    if (dateInvalid) { setFieldErrors({ endDate: "End date cannot be before start date" }); return; }
    const parsed = createCollegeCohortSchema.safeParse({
      programId, startPeriodId, expectedEndPeriodId: expectedEndPeriodId || null,
      name, code,academicYear:academicYear||null,startDate:startDate||null,endDate:endDate||null,
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] = issue.message;
      setFieldErrors(fields);
      setNotice("Batch was not created. Check the highlighted fields.");
      setNoticeIsError(true);
      return;
    }
    startTransition(async () => {
      try {
        await send("POST", "/api/college/batches", parsed.data);
        setName("");
        setCode("");
        setAcademicYear("");setStartDate("");setEndDate(""); setFieldErrors({});
        setExpectedEndPeriodId("");
        setNotice(`Created batch “${parsed.data.name}”. Next, create its classes/sections.`);
        showToast({ tone: "success", title: `Created batch “${parsed.data.name}”. Next, create its classes/sections.` });
        router.refresh();
      } catch (error) {
        setFieldErrors(cohortErrors(error));
        setNotice(academicSetupErrorMessage(error, "Batch was not created."));
        setNoticeIsError(true);
      }
    });
  }

  return <Disclosure ariaLabel="Create Batch" title={<h2 className="m-0 text-lg font-semibold text-[var(--lms-heading)]">Create Batch</h2>} className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
    {programs.length === 0 || periods.length === 0
      ? <p role="status" className="mt-2 text-sm text-muted-foreground leading-[22px]">
        {programs.length === 0 ? "Create a program before adding batches." : <>
          Create a usable academic period before adding batches.{" "}
          <Link href={academicSetupHref} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Set up academic periods</Link>
        </>}
      </p>
      : <form onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Select value={programId} error={Boolean(fieldErrors.programId)}
            onChange={e => { setProgramId(e.target.value); setFieldErrors(current => ({ ...current, programId: "" })); }}
            className="min-h-11 md:min-h-9 ">
            <option value="">Select program</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
          {fieldErrors.programId ? <span role="alert" className="text-xs text-error">{fieldErrors.programId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start academic period
          <Select value={startPeriodId} error={Boolean(fieldErrors.startPeriodId)}
            onChange={e => startPeriodChanged(e.target.value)}
            className="min-h-11 md:min-h-9 ">
            <option value="">Choose period</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
          {fieldErrors.startPeriodId ? <span role="alert" className="text-xs text-error">{fieldErrors.startPeriodId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch Name
          <Input maxLength={255} value={name} error={Boolean(fieldErrors.name)}
            onChange={e => { setName(e.target.value); setFieldErrors(current => ({ ...current, name: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9" />
          {fieldErrors.name ? <span role="alert" className="text-xs text-error">{fieldErrors.name}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code
          <Input maxLength={64} value={code} error={Boolean(fieldErrors.code)}
            onChange={e => { setCode(e.target.value); setFieldErrors(current => ({ ...current, code: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9" />
          {fieldErrors.code ? <span role="alert" className="text-xs text-error">{fieldErrors.code}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Expected end period (optional)
          <Select disabled={pending} value={expectedEndPeriodId} onChange={e => setExpectedEndPeriodId(e.target.value)}
            className="min-h-11 md:min-h-9 ">
            <option value="">Not specified</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic Year
          <Input maxLength={7} value={academicYear} error={Boolean(fieldErrors.academicYear)}
            onChange={e => { setAcademicYear(e.target.value); setFieldErrors(current => ({ ...current, academicYear: "" })); }}
            placeholder="e.g., 2024-25" className="min-h-11 min-w-0 md:min-h-9"/>
          {fieldErrors.academicYear ? <span role="alert" className="text-xs text-error">{fieldErrors.academicYear}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date
          <Input type="date" value={startDate} error={Boolean(fieldErrors.startDate)}
            onChange={e=>startDateChanged(e.target.value)}
            className="min-h-11 min-w-0 md:min-h-9"/>
          {fieldErrors.startDate ? <span role="alert" className="text-xs text-error">{fieldErrors.startDate}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date
          <Input type="date" value={endDate} min={startDate||start?.startDate||undefined}
            error={Boolean(fieldErrors.endDate)}
            onChange={e => { setEndDate(e.target.value); setFieldErrors(current => ({ ...current, endDate: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9"/>
          {fieldErrors.endDate ? <span role="alert" className="text-xs text-error">{fieldErrors.endDate}</span> : null}
        </label>
        <div className="min-w-0 space-y-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-sm text-body md:col-span-2">
          <p>Start Date: {start?.startDate??"Choose start period"} · End Date: {end?.endDate??"Not specified"}</p>
          <div className="flex flex-wrap items-end gap-[var(--lms-space-2)]">
            <label className="grid min-w-0 gap-[var(--lms-space-1)] text-xs font-semibold">
              Academic year starts in
              <Select value={startMonth} onChange={e => {
                const value = Number(e.target.value);
                setStartMonth(value);
                if (programId) {
                  try { localStorage.setItem("batch-academic-year-start-month:" + programId, String(value)); }
                  catch { /* Preference is optional. */ }
                }
              }} className="min-h-11 md:min-h-9">
                {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </Select>
            </label>
            <Button type="button" variant="secondary" disabled={!yearSource}
              onClick={() => setAcademicYear(suggestedYear)}>Recalculate</Button>
          </div>
          <p>Academic Year: {suggestedYear || "Select a start period to see the academic year."}</p>
          <p>New batches start as Planned in vNext. Batch code and starting period are required to track progression.</p>
          {dateInvalid?<p role="alert" className="text-error">End date cannot be before start date</p>:null}
        </div>
        <div className="flex justify-stretch border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:justify-end">
          <Button variant="primary" disabled={pending||dateInvalid} type="submit" className="w-full md:w-auto"
            >
            {pending ? "Creating…" : "Create Batch"}
          </Button>
        </div>
      </form>}
    {notice ? <Alert tone={noticeIsError ? "error" : "success"} className="mt-[var(--lms-space-3)]">
      <span>{notice}</span>
      <Button variant="ghost" type="button" className="self-start"
        onClick={() => { setNotice(""); setNoticeIsError(false); }}>Dismiss</Button>
    </Alert> : null}
  </Disclosure>;
}

export function CollegeCohortRowActions({ row, periods }: {
  row: Batch; periods: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const studentsHref = (pathname?.startsWith("/admin/") ? "/admin/batches/" : "/college/batches/") +
    encodeURIComponent(row.id) + "/students";
  const { showToast } = useToast();
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
  const [removeError, setRemoveError] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
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
    if(pending)return;
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
    if(pending||row.status!=="PLANNED")return;
    if(pendingLifecycleAction!=="RETIRE") {setPendingLifecycleAction("RETIRE");return;}
    setPendingLifecycleAction(null);setNotice("");
    startTransition(async()=>{
      try {
        await apiFetch("/api/college/batches/"+encodeURIComponent(row.id),{
          method:"DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:new Date(row.updatedAt).toISOString(),confirm:true}),
        });
        setNotice(`Archived batch “${row.name}”. Historical records are preserved.`);
        setRemoveError(false);
        showToast({ tone: "success", title: `Archived batch “${row.name}”.` });
        router.refresh();
      }catch(error){
        setRemoveError(true);
        setNotice(academicSetupErrorMessage(error, "Batch was not archived."));
      }
    });
  }
  function close() {
    if (hasUnsavedCollegeCohortEdit(original, draft) && !discardConfirm) {setDiscardConfirm(true);return;}
    setDiscardConfirm(false);setEditing(false);
    setNotice("");setEditErrors({});
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice(""); setEditErrors({});
    if (!name.trim()) { setEditErrors({ name: "Enter a batch name" }); return; }
    if (academicYear !== (row.academicYear ?? "") && !validAcademicYear(academicYear)) {
      // Legacy persisted extended academic years can still be displayed, but new
      // edits use the old LMS consecutive-year format.
      setEditErrors({ academicYear: "Use consecutive years, e.g., 2026-27" }); return;
    }
    if (startDate && endDate && endDate < startDate) {
      setEditErrors({ endDate: "End date cannot be before start date" }); return;
    }
    const parsed = updateCollegeCohortSchema.safeParse({ ...draft, confirm: true });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] = issue.message;
      setEditErrors(fields);
      setNotice("Batch was not updated. Check the highlighted fields.");
      return;
    }

    startTransition(async () => {
      try {
        await send("PATCH", "/api/college/batches/" + encodeURIComponent(row.id), parsed.data);
        setEditing(false);setDiscardConfirm(false);setEditErrors({});
        setNotice(`Updated batch “${parsed.data.name}”.`);
        showToast({ tone: "success", title: `Updated batch “${parsed.data.name}”.` });
        router.refresh();
      } catch (error) {
        setEditErrors(cohortErrors(error));
        setNotice(academicSetupErrorMessage(error, "Batch was not updated."));
      }
    });
  }

  return <div className="min-w-0">
    <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] sm:justify-end">
    <Button variant="secondary" type="button" disabled={pending || blocked}
      onClick={() => {
        setEditing(true);setDiscardConfirm(false);setPendingLifecycleAction(null);
        setNotice("");setEditErrors({});setRemoveError(false);
      }}
      >
      Edit
    </Button>
    <Link href={studentsHref} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
      Students
    </Link>
    <Dropdown trigger="More" label="Batch lifecycle actions" align="end" mobileSheet triggerClassName="md:!min-h-9">
      <Menu className="w-full min-w-0">
    {row.status === "ACTIVE" && <MenuItem type="button"
      disabled={pending || !row.currentTermNumber || (row.durationTerms !== undefined && row.currentTermNumber < row.durationTerms)}
      onClick={graduate}
      >
      Mark graduated
    </MenuItem>}
    <MenuItem type="button" disabled={pending || row.status!=="PLANNED" ||
        row.activeSections>0 || row.activeEnrolledLearners>0} onClick={retire}
      title={row.activeSections>0 || row.activeEnrolledLearners>0
        ? `Cannot archive while ${row.activeSections} classes and ${row.activeEnrolledLearners} students are linked.`
        : row.status!=="PLANNED" ? "Only unlinked planned batches may be archived; historical batches remain retained."
          : "Archive this unlinked planned batch. Records are not physically deleted."}
      >
      Archive
    </MenuItem>
      </Menu>
    </Dropdown>
    </div>
    <ConfirmDialog open={Boolean(pendingLifecycleAction)}
      onOpenChange={next=>{if(!next)setPendingLifecycleAction(null);}}
      title={pendingLifecycleAction==="GRADUATE"?"Mark this batch graduated?":"Archive this planned batch?"}
      description={pendingLifecycleAction==="GRADUATE"
        ? `Mark "${row.name}" graduated? This completes the batch after its final registered semester.`
        : `Archive planned batch "${row.name}"? This preserves the batch identifier and history; no physical deletion occurs.`}
      confirmLabel={pendingLifecycleAction==="GRADUATE"?"Mark graduated":"Archive batch"}
      pending={pending} onConfirm={pendingLifecycleAction==="GRADUATE"?graduate:retire}/>
    {removeError ? <Alert tone="error" className="mt-2">
      <span>{notice || "Batch was not archived."}</span>
      <Button type="button" variant="secondary" disabled={pending} onClick={retire}>Retry archive</Button>
    </Alert> : null}
    {blocked ? <p className="mt-1 text-xs text-muted-foreground leading-5">
      Archived batches cannot be edited.
    </p> : null}
    {editing ? <Dialog open={editing} onOpenChange={next=>{if(!next)close();}}
      title={"Edit Batch " + row.name}>
      <form onSubmit={save} className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
        
        <p className="text-sm text-muted-foreground md:col-span-2 leading-[22px]">Program and starting period cannot change after creation. Status: {row.status}. Planned batches can be archived only before class or student records exist; active batches may be marked Completed after their final term. The legacy Inactive transition is not supported by this progression model.</p>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch Name
          <Input maxLength={255} value={name} error={Boolean(editErrors.name)}
            onChange={e => { setName(e.target.value); setEditErrors(current => ({ ...current, name: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9" />
          {editErrors.name ? <span role="alert" className="text-xs text-error">{editErrors.name}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code
          <Input maxLength={64} value={code} error={Boolean(editErrors.code)}
            onChange={e => { setCode(e.target.value); setEditErrors(current => ({ ...current, code: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9" />
          {editErrors.code ? <span role="alert" className="text-xs text-error">{editErrors.code}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Expected end period
          <Select value={expectedEndPeriodId} error={Boolean(editErrors.expectedEndPeriodId)}
            onChange={e => { setExpectedEndPeriodId(e.target.value); setEditErrors(current => ({ ...current, expectedEndPeriodId: "" })); }}
            className="min-h-11 md:min-h-9 ">
            <option value="">Not specified</option>
            {row.expectedEndPeriodId && !periods.some(p => p.id === row.expectedEndPeriodId) ?
              <option value={row.expectedEndPeriodId}>Previously recorded period (unavailable)</option> : null}
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
          {editErrors.expectedEndPeriodId ? <span role="alert" className="text-xs text-error">{editErrors.expectedEndPeriodId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic Year
          <Input maxLength={16} value={academicYear} error={Boolean(editErrors.academicYear)}
            onChange={e => { setAcademicYear(e.target.value); setEditErrors(current => ({ ...current, academicYear: "" })); }}
            placeholder="e.g., 2024-25" className="min-h-11 min-w-0 md:min-h-9"/>
          {editErrors.academicYear ? <span role="alert" className="text-xs text-error">{editErrors.academicYear}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date
          <Input type="date" disabled={endDateLocked} error={Boolean(editErrors.startDate)}
            value={startDate} onChange={e => { setStartDate(e.target.value); setEditErrors(current => ({ ...current, startDate: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9"/>
          {editErrors.startDate ? <span role="alert" className="text-xs text-error">{editErrors.startDate}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date
          <Input type="date" disabled={endDateLocked} error={Boolean(editErrors.endDate)}
            value={endDate} min={startDate||undefined}
            onChange={e => { setEndDate(e.target.value); setEditErrors(current => ({ ...current, endDate: "" })); }}
            className="min-h-11 min-w-0 md:min-h-9"/>
          {editErrors.endDate ? <span role="alert" className="text-xs text-error">{editErrors.endDate}</span> : null}
        </label>
        {endDateLocked && <p className="text-xs text-muted-foreground md:col-span-2 leading-5">
          End period is locked because the batch has enrolled learners or classes. Name and code remain editable.
        </p>}
        {notice ? <Alert tone="error" className="md:col-span-2" title="Batch was not updated">
          <span>{notice}</span>
          <Button type="button" variant="ghost" className="self-start" onClick={() => setNotice("")}>Dismiss</Button>
        </Alert> : null}
        <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
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
      onConfirm={()=>{setDiscardConfirm(false);setEditing(false);setNotice("");setEditErrors({});}}/>
    {!editing && notice && !removeError ? <p role="status" className="mt-1 text-xs text-body leading-5">{notice}</p> : null}
  </div>;
}
