"use client";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/selection-controls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {
  createCollegeSemesterSchema,
  updateCollegeSemesterSchema,
} from "@/modules/academics/semester-mutation-model";
import { SEMESTER_COPY } from "@/modules/academics/semester-copy";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

type ProgramOption = { id: string; name: string; code: string };
type SemesterRow = {
  id: string;
  name: string;
  termNumber: number;
  programName: string;
  totalCredits: number | null;
  isActive: boolean;
  updatedAt: Date;
  mappedCourses: number;
  legacyStructureStatus?: "ACTIVE" | "INACTIVE" | "COMPLETED" | null;
};

async function mutate(method: "POST" | "PATCH" | "DELETE", url: string, body: unknown) {
  return apiFetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

type SemesterFieldErrors = { program?: string; number?: string; name?: string };
function semesterFieldErrors(error: unknown): SemesterFieldErrors {
  if (!(error instanceof FriendlyFetchError)) return {};
  const fields = error.fieldErrors;
  return {
    program: fields.program_id ?? fields.programId ??
      (error.code === "PROGRAM_NOT_FOUND" ? "Please select program" : undefined),
    number: fields.semester_number ?? fields.termNumber ?? fields.semesterNumber ??
      (error.code === "SEMESTER_NUMBER_CONFLICT" ? "This semester number already exists for the program."
        : error.code === "SEMESTER_OUTSIDE_PROGRAM_DURATION" ? "Semester number is outside the program duration." : undefined),
    name: fields.name,
  };
}

export function CollegeSemesterCreateForm({ programs }: { programs: ProgramOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const programsHref = pathname?.startsWith("/admin/") ? "/admin/programs" : "/college/programs";
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();
  const programRef = useRef<HTMLSelectElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const createNameRef = useRef<HTMLInputElement>(null);
  const [createErrors, setCreateErrors] = useState<SemesterFieldErrors>({});
  const [createError, setCreateError] = useState("");
  const [programId, setProgramId] = useState("");
  const [termNumber, setTermNumber] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");
    setCreateError("");
    setCreateErrors({});
    const errors: SemesterFieldErrors = {
      program: !programId ? "Please select program" : undefined,
      number: !termNumber.trim() ? "Enter semester number"
        : !Number.isInteger(Number(termNumber)) || Number(termNumber) < 1 ? "Semester number must be 1 or more"
        : Number(termNumber) > 12 ? "Semester number must be between 1 and 12" : undefined,
      name: !name.trim() ? "Please enter semester name"
        : name.trim().length > 255 ? "Name must be 255 characters or less" : undefined,
    };
    if (errors.program || errors.number || errors.name) {
      setCreateErrors(errors);
      if (errors.program) programRef.current?.focus();
      else if (errors.number) numberRef.current?.focus();
      else createNameRef.current?.focus();
      return;
    }
    const parsed = createCollegeSemesterSchema.safeParse({
      programId, termNumber: Number(termNumber), name,
      totalCredits: null,
    });
    if (!parsed.success) {
      setCreateErrors({ name: parsed.error.issues[0]?.message ?? "Check semester details." });
      return;
    }
    startTransition(async () => {
      try {
        await mutate("POST", "/api/academics/semesters", parsed.data);
        setName("");
        setProgramId(parsed.data.programId);
        showToast({ tone: "success", title: SEMESTER_COPY.createdMessage(parsed.data.name) });
        router.refresh();
      } catch (error) {
        setCreateErrors(semesterFieldErrors(error));
        const message = academicSetupErrorMessage(error, SEMESTER_COPY.createFailed);
        setCreateError(message);
        if (Object.values(semesterFieldErrors(error)).every(value => !value))
          showToast({ tone: "error", title: message });
      } finally {
        deleteInFlight.current = false;
      }
    });
  }

  return (
    <section aria-label={SEMESTER_COPY.createTitle}
      className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-canvas-padding)]">
      <h2 className="font-semibold text-[var(--lms-heading)]">{SEMESTER_COPY.createTitle}</h2>
      {programs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">
          Create a program before adding semesters.{" "}
          <Link href={programsHref} className="font-semibold text-[var(--lms-link-text)] underline">Go to Programs</Link>
        </p>
      ) : (
        <form noValidate onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-3)]">
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.programLabel}
            <Select ref={programRef} required value={programId} aria-invalid={Boolean(createErrors.program)} aria-describedby={createErrors.program ? "semester-program-error" : undefined}
              onChange={e => { setProgramId(e.target.value); setCreateErrors(current => ({ ...current, program: undefined })); }}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="">Select program</option>
              {programs.map(program => <option key={program.id} value={program.id}>
                {program.name} ({program.code})
              </option>)}
            </Select>
            {createErrors.program ? <span role="alert" id="semester-program-error" className="text-xs text-error">{createErrors.program}</span> : null}
          </label>
          <label className="grid max-w-[220px] gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.numberLabel}
            <Input ref={numberRef} required type="number" min={1} max={12} step={1} value={termNumber}
              aria-invalid={Boolean(createErrors.number)} aria-describedby={createErrors.number ? "semester-number-error" : undefined} placeholder={SEMESTER_COPY.numberPlaceholder}
              onChange={e => { setTermNumber(e.target.value); setCreateErrors(current => ({ ...current, number: undefined })); }}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
          <div className="grid grid-cols-1 gap-[var(--lms-space-3)] sm:grid-cols-2">
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Program
              <Input value={row.programName} readOnly disabled
                title="Program cannot change after creation" aria-label="Program (cannot change)" />
            </label>
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Semester Number
              <Input value={row.termNumber} readOnly disabled
                title="Semester number cannot change after creation" aria-label="Semester Number (cannot change)" />
            </label>
          </div>
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.nameLabel}
            <Input ref={createNameRef} required maxLength={255} value={name} aria-invalid={Boolean(createErrors.name)} aria-describedby={createErrors.name ? "semester-name-error" : undefined}
              onChange={e => { setName(e.target.value); setCreateErrors(current => ({ ...current, name: undefined })); }}
              placeholder={SEMESTER_COPY.namePlaceholder}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
          {createErrors.name ? <p role="alert" id="semester-name-error" className="text-xs text-error">{createErrors.name}</p> : null}
          {createErrors.number ? <p role="alert" id="semester-number-error" className="text-xs text-error">{createErrors.number}</p> : null}
          <p className="border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-xs text-body md:col-span-2 leading-5">
            Total credits are calculated from courses mapped to this semester.
          </p>
          <div className="flex items-center gap-3 text-sm text-body">
            <Switch label="Active" checked disabled />
            <span className="text-xs text-muted-foreground">New semesters start Active. You can change their status afterward.</span>
          </div>
          <div className="flex items-end justify-stretch md:col-span-2 md:justify-end">
            <Button variant="primary" type="submit" disabled={pending} loading={pending} className="min-h-11 w-full md:min-h-9 md:w-auto">
              <span aria-hidden="true">＋</span> {pending ? "Saving…" : SEMESTER_COPY.createButton}
            </Button>
          </div>
        </form>
      )}
      {createError ? <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm text-body">
        <p><strong>{SEMESTER_COPY.createFailed}</strong>: {createError}</p>
        <Button variant="secondary" type="button" onClick={() => setCreateError("")}>Dismiss</Button>
      </div> : null}
      {notice ? <p role="status" className="mt-3 text-sm text-body leading-[22px]">{notice}</p> : null}
    </section>
  );
}

export function CollegeSemesterRowActions({ row }: { row: SemesterRow }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [deleteError, setDeleteError] = useState("");
  const deleteInFlight = useRef(false);
  const editNameRef = useRef<HTMLInputElement>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<SemesterFieldErrors>({});
  const [editError, setEditError] = useState("");
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [name, setName] = useState(row.name);
  const [isActive, setIsActive] = useState(row.isActive);
  const [notice, setNotice] = useState("");
  const url = "/api/academics/semesters/" + encodeURIComponent(row.id);
  const changed=name!==row.name||isActive!==row.isActive;
  function closeEditor(){
    if(pending)return;
    if(changed){setDiscardOpen(true);return;}
    setEditing(false);
  }
  function discardEditor(){
    setName(row.name);setIsActive(row.isActive);setDiscardOpen(false);setEditing(false);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");
    setEditError("");
    setEditFieldErrors({});
    if (!name.trim() || name.trim().length > 255) {
      setEditFieldErrors({ name: !name.trim() ? "Please enter semester name" : "Name must be 255 characters or less" });
      editNameRef.current?.focus();
      return;
    }
    const parsed = updateCollegeSemesterSchema.safeParse({
      name, totalCredits: row.totalCredits, isActive,
      expectedUpdatedAt:row.updatedAt.toISOString(),confirm:true,
    });
    if (!parsed.success) {
      setEditFieldErrors({ name: parsed.error.issues[0]?.message ?? "Check semester details." });
      editNameRef.current?.focus();
      return;
    }

    startTransition(async () => {
      try {
        await mutate("PATCH", url, parsed.data);
        setEditing(false);
        const message = name === row.name && isActive !== row.isActive
          ? "Status updated successfully." : SEMESTER_COPY.updatedMessage;
        showToast({ tone: "success", title: message });
        router.refresh();
      } catch (error) {
        setEditFieldErrors(semesterFieldErrors(error));
        const message = academicSetupErrorMessage(error, SEMESTER_COPY.updateFailed);
        setEditError(message);
        if (Object.values(semesterFieldErrors(error)).every(value => !value))
          showToast({ tone: "error", title: message });
      }
    });
  }

  function remove() {
    if(pending || deleteInFlight.current)return;
    deleteInFlight.current = true;
    setNotice("");
    setDeleteError("");
    startTransition(async () => {
      try {
        await mutate("DELETE", url, { confirm: true });
        setConfirming(false);
        showToast({ tone: "success", title: SEMESTER_COPY.deletedMessage });
        router.refresh();
      } catch (error) {
        setConfirming(false);
        const message = academicSetupErrorMessage(error, SEMESTER_COPY.deleteFailed);
        setDeleteError(message);
        showToast({ tone: "error", title: message });
      }
    });
  }

  return (
    <div className="min-w-0 space-y-[var(--lms-space-2)]">
      {!editing && !confirming ? (
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-[var(--lms-space-2)] sm:justify-end">
          <Button variant="ghost" size="icon-sm" type="button" disabled={pending}
            title="Edit" aria-label={"Edit semester " + row.name}
            onClick={() => { setNotice(""); setEditError(""); setEditFieldErrors({});
              setName(row.name);setIsActive(row.isActive);setEditing(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 20l4.8-1.1L20 7.7 16.3 4 5.1 15.2 4 20Z"
                stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="m14.7 5.7 3.7 3.7" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon-sm" type="button" disabled={pending}
            title="Delete" aria-label={"Delete semester " + row.name}
            onClick={() => { setNotice(""); setConfirming(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v6m4-6v6"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
      ) : null}
      {editing ? (
        <Dialog open={editing} onOpenChange={next=>{if(!next)closeEditor();}}
          title={SEMESTER_COPY.editTitle}
          description={SEMESTER_COPY.promotionNote}
          className="!max-w-[520px]" dismissible={!pending}>
        <form noValidate onSubmit={save} className="grid min-w-0 gap-[var(--lms-space-4)]">
          {editError ? <div role="alert" className="flex items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm">
            <p><strong>{SEMESTER_COPY.updateFailed}</strong>: {editError}</p>
            <Button variant="secondary" type="button" onClick={() => setEditError("")}>Dismiss</Button>
          </div> : null}
          
          
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {SEMESTER_COPY.nameLabel}
            <Input ref={editNameRef} required maxLength={255} value={name} aria-invalid={Boolean(editFieldErrors.name)}
              onChange={e => { setName(e.target.value); setEditFieldErrors({}); }}
              className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 text-sm text-foreground" />
            {editFieldErrors.name ? <span role="alert" className="text-xs text-error">{editFieldErrors.name}</span> : null}
          </label>
          <div className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
            <label htmlFor={"semester-credits-" + row.id}>Total Credits</label>
            <Input id={"semester-credits-" + row.id} value={row.totalCredits ?? "Calculated from course mappings"}
              readOnly disabled aria-label="Total Credits (calculated from mapped courses)"
              title="Credits are calculated from the courses mapped to this semester" />
            <p className="text-xs font-normal text-body">Credits come from mapped courses and cannot be edited here.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-body">
            <Switch label={SEMESTER_COPY.statusLabel} checked={isActive}
              disabled={pending || row.legacyStructureStatus === "COMPLETED"}
              onChange={e => setIsActive(e.target.checked)} />
            <span role="status">{row.legacyStructureStatus === "COMPLETED" ? "Completed" :
              isActive ? SEMESTER_COPY.statusActive : SEMESTER_COPY.statusInactive}</span>
          </div>
          <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button variant="secondary" type="button" disabled={pending} onClick={closeEditor}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={pending} loading={pending}>
              {pending ? "Saving…" : SEMESTER_COPY.saveButton}
            </Button>
          </div>
        </form>
        </Dialog>
      ) : null}
      <ConfirmDialog open={confirming} onOpenChange={setConfirming}
        title={SEMESTER_COPY.deleteTitle}
        description={SEMESTER_COPY.deleteBlocked}
        confirmLabel="Yes" cancelLabel="No" confirmVariant="danger" pending={pending}
        confirmDisabled={row.mappedCourses>0} onConfirm={remove}/>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard semester changes?"
        description="Your unsaved semester edits will be lost."
        confirmLabel="Discard changes" confirmVariant="danger" pending={pending} onConfirm={discardEditor}/>
      {deleteError ? <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm">
        <p><strong>{SEMESTER_COPY.deleteFailed}</strong>: {deleteError}</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => { setDeleteError(""); setConfirming(true); }}>Retry delete</Button>
          <Button type="button" variant="ghost" onClick={() => setDeleteError("")}>Dismiss</Button>
        </div>
      </div> : null}
      {notice ? <p role="status" className="text-xs text-body leading-5">{notice}</p> : null}
    </div>
  );
}
