"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";



import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { electiveSlotFormErrorsFromIssues } from "@/modules/electives/college-slot-mutation-model";
import { useRef, useState, useTransition, type FormEvent } from "react";

export type SlotFormRow = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  credits: number;
  minPick: number;
  maxPick: number;
  status: string;
  programId?: string;
  academicPeriodId?: string | null;
  semesterNumber?: number;
  academicYear?: string | null;
  hasEnrollmentHistory?: boolean;
};

type Options = {
  programs: { id: string; name: string; durationTerms: number }[];
  periods: { id: string; name: string }[];
};

const fieldClass = "min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-foreground";
function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}{children}
    {error ? <span role="alert" className="text-xs text-error">{error}</span> : null}
  </label>;
}

export function CollegeSlotManager({ options, row }: {
  options: Options;
  row?: SlotFormRow;
}) {
  const editing = Boolean(row);
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const initialDraft = useRef("");
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, transition] = useTransition();
  const [programId, setProgramId] = useState(row?.programId ?? "");
  const [periodId, setPeriodId] = useState(row?.academicPeriodId ?? "");
  const [term, setTerm] = useState(String(row?.semesterNumber ?? 1));
  const [year, setYear] = useState(row?.academicYear ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [credits, setCredits] = useState(String(row?.credits ?? 3));
  const [minPick, setMinPick] = useState(String(row?.minPick ?? 1));
  const [maxPick, setMaxPick] = useState(String(row?.maxPick ?? 1));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const limit = options.programs.find(p => p.id === programId)?.durationTerms ?? 12;
  const locked = Boolean(row?.hasEnrollmentHistory);
  const knownIdentity = !row || Boolean(row.programId && row.semesterNumber);

  function snapshot() {
    return JSON.stringify({ programId, periodId, term, year, name, description, credits, minPick, maxPick });
  }

  function openEditor() {
    if (open) { requestClose(); return; }
    initialDraft.current = snapshot();
    setFieldErrors({});
    setError(null);
    setOpen(true);
  }

  function requestClose() {
    if (pending) return;
    if (snapshot() !== initialDraft.current) { setDiscardOpen(true); return; }
    setOpen(false);
    setError(null);
  }

  function discard() {
    setProgramId(row?.programId ?? "");
    setPeriodId(row?.academicPeriodId ?? "");
    setTerm(String(row?.semesterNumber ?? 1)); setYear(row?.academicYear ?? "");
    setName(row?.name ?? ""); setDescription(row?.description ?? "");
    setCredits(String(row?.credits ?? 3)); setMinPick(String(row?.minPick ?? 1));
    setMaxPick(String(row?.maxPick ?? 1));
    setFieldErrors({}); setError(null);
    setDiscardOpen(false); setOpen(false);
  }

  function apiError(result: { error?: string; issues?: { path?: (string | number)[]; message?: string }[] } | null): string {
    switch (result?.error) {
      case "ELECTIVE_SLOT_STALE": return "This elective slot was changed elsewhere. Copy your changes before refreshing and retrying.";
      case "ELECTIVE_SELECTION_LOCKED": return "Enrollment history prevents changes to program, semester, year, credits or pick limits.";
      case "ELECTIVE_SLOT_ARCHIVED": return "An archived slot cannot be edited";
      case "ELECTIVE_YEAR_INVALID": return "Academic year must use YYYY-YY format, e.g. 2026-27";
      case "ELECTIVE_SEMESTER_INVALID": return `This program has only ${limit} semesters`;
      case "ELECTIVE_PROGRAM_NOT_FOUND": return "Select a program in this college.";
      case "ELECTIVE_PERIOD_INVALID": return "The selected academic period is unavailable.";
      case "ELECTIVE_SLOT_NOT_FOUND": return "This elective slot is unavailable. Refresh before retrying.";
      case "INVALID_REQUEST": return result.issues?.[0]?.message ?? "Review the highlighted fields.";
      default: return "Unable to save elective slot. Review the fields and try again.";
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields: Record<string, string> = {};
    if (!row && !programId) fields["programId"] = "Select a program";
    if ((!row || knownIdentity) && (!term || !Number.isInteger(Number(term)) || Number(term) < 1)) fields["term"] = "Semester is required";
    else if ((!row || knownIdentity) && Number(term) > Math.min(12, limit)) fields["term"] = `This program has only ${limit} semesters`;
    if (!name.trim()) fields["name"] = "Name is required";
    else if (name.trim().length > 150) fields["name"] = "Name cannot exceed 150 characters";
    if (year.trim() && !/^\d{4}-\d{2}$/.test(year.trim())) {
      fields["year"] = "Academic year must use YYYY-YY format, e.g. 2026-27";
    } else if (year.trim()) {
      const start = Number(year.slice(0, 4));
      if (Number(year.slice(5)) !== (start + 1) % 100) {
        fields["year"] = "Academic year must use YYYY-YY format, e.g. 2026-27";
      }
    }
    if (!Number.isInteger(Number(credits)) || Number(credits) < 0 || Number(credits) > 30) {
      fields["credits"] = "Credits must be a whole number from 0 to 30";
    }
    if (!Number.isInteger(Number(minPick)) || Number(minPick) < 0 || Number(minPick) > 10) {
      fields["minPick"] = "Minimum choices must be from 0 to 10";
    }
    if (!Number.isInteger(Number(maxPick)) || Number(maxPick) < 1 ||
        (Number(maxPick) > 10 && (!row || Number(maxPick) !== row.maxPick))) {
      fields["maxPick"] = "Maximum choices must be from 1 to 10";
    }
    if (Number(minPick) > Number(maxPick)) fields["maxPick"] = "Pick range is invalid";
    setFieldErrors(fields);
    if (Object.keys(fields).length > 0) {
      setError("Please correct the highlighted fields.");
      const first=Object.keys(fields)[0]!;
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const common = {
      name, description: description.trim() || null,
      credits: Number(credits), minPick: Number(minPick),
      maxPick: Number(maxPick), confirm: true,
    };
    const payload = row
      ? { ...common, expectedVersion: row.version,
          ...(knownIdentity && !locked ? {
            programId, academicPeriodId: periodId || null,
            semesterNumber: Number(term), academicYear: year.trim() || null,
          } : {}),
        }
      : {
          ...common, programId, academicPeriodId: periodId || null,
          semesterNumber: Number(term), academicYear: year.trim() || null,
        };
    setError(null);
    transition(async () => {
      try {
        const response = await fetch(
          row ? "/api/academics/elective-slots/" + encodeURIComponent(row.id)
            : "/api/academics/elective-slots",
          { method: row ? "PATCH" : "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          const serverFields = electiveSlotFormErrorsFromIssues(result?.issues);
          if (Object.keys(serverFields).length) {
             setFieldErrors(serverFields);
             const field=Object.keys(serverFields)[0]!;
             formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
           }
          throw new Error(apiError(result));
        }
        setOpen(false);
        setDiscardOpen(false);
        showToast({ tone: "success", title: row ? "Slot saved" : "Slot created" });
        if (!row) {
          setName("");
          setDescription("");
        }
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save elective slot");
      }
    });
  }

  return <div className="min-w-0">
    <Button aria-label={editing ? `Edit elective slot ${row?.name ?? ""}` : "New slot"} variant={editing ? "secondary" : "primary"} type="button" disabled={pending || row?.status === "ARCHIVED" || (!editing && options.programs.length === 0)}
      onClick={openEditor}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      {row ? "Edit slot" : "New slot"}
    </Button>
    <Dialog open={open} onOpenChange={next => { if (!next) requestClose(); else openEditor(); }}
      title={editing ? "Edit Elective Slot" : "New Elective Slot"} dismissible={!pending}
      className="max-w-[640px]">
    <form ref={formRef} noValidate onSubmit={submit} className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
      {row ? <p role="note" className="md:col-span-2 text-xs text-muted-foreground">
        {locked
          ? "Enrollment history exists. Program, semester, academic year, credits and choice limits are locked; name and description remain editable."
          : "Before students make selections you can correct program, semester, academic year, credits and choice limits."}
      </p> : null}
      {knownIdentity ? <>
        <Field label="Program" error={fieldErrors["programId"]}><Select required name="programId" aria-invalid={Boolean(fieldErrors["programId"])} disabled={locked} className={fieldClass} value={programId}
          onChange={event => setProgramId(event.target.value)}>
          <option value="">Select program</option>
          {options.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select></Field>
        <Field label="Academic period (optional)" error={fieldErrors["periodId"]}><Select name="periodId" aria-invalid={Boolean(fieldErrors["periodId"])} disabled={locked} className={fieldClass} value={periodId}
          onChange={event => setPeriodId(event.target.value)}>
          <option value="">No period linked</option>
          {options.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select></Field>
        <Field label="Semester number" error={fieldErrors["term"]}><Input name="term" aria-invalid={Boolean(fieldErrors["term"])} disabled={locked} type="number" min={1} max={Math.min(12, limit)}
          className={fieldClass} value={term} onChange={event => setTerm(event.target.value)} /></Field>
        <Field label="Academic year (optional, YYYY-YY)" error={fieldErrors["year"]}><Input name="year" aria-invalid={Boolean(fieldErrors["year"])} disabled={locked} maxLength={7}
          placeholder="2026-27" className={fieldClass} value={year}
          onChange={event => setYear(event.target.value)} /></Field>
      </> : null}
      <Field label="Slot name" error={fieldErrors["name"]}><Input name="name" maxLength={150} error={Boolean(fieldErrors["name"])} className={fieldClass}
        value={name} onChange={event => setName(event.target.value)} /></Field>
      <Field label="Description" error={fieldErrors["description"]}><Textarea name="description" aria-invalid={Boolean(fieldErrors["description"])} rows={2} maxLength={1000}
         placeholder="Enter slot description (optional)" className={fieldClass}
         value={description} onChange={event => setDescription(event.target.value)} /></Field>
      <Field label="Credits" error={fieldErrors["credits"]}><Input name="credits" aria-invalid={Boolean(fieldErrors["credits"])} disabled={locked} type="number" min={0} max={30}
        className={fieldClass} value={credits} onChange={event => setCredits(event.target.value)} /></Field>
      <Field label="Minimum choices" error={fieldErrors["minPick"]}><Input name="minPick" aria-invalid={Boolean(fieldErrors["minPick"])} disabled={locked} type="number" min={0} max={10}
        className={fieldClass} value={minPick} onChange={event => setMinPick(event.target.value)} /></Field>
      <Field label="Maximum choices" error={fieldErrors["maxPick"]}><Input name="maxPick" aria-invalid={Boolean(fieldErrors["maxPick"])} disabled={locked} type="number" min={1} max={10} title="You can select up to 10 electives"
        className={fieldClass} value={maxPick} onChange={event => setMaxPick(event.target.value)} /></Field>
      {error ? <p role="alert" className="md:col-span-2 text-sm text-error">{error}</p> : null}
      <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row md:col-span-2 [&>button]:min-h-11 [&>button]:w-full sm:[&>button]:w-auto md:[&>button]:min-h-9">
        <Button variant="primary" type="submit" disabled={pending}
          >
          {pending ? "Saving…" : editing ? "Save Changes" : "Create Slot"}
        </Button>
        <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}
          >
          Cancel
        </Button>
      </div>
    </form>
    </Dialog>
    <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
      title={row ? "Discard elective slot edits?" : "Discard this elective slot draft?"}
      description="Changes you have not saved will be lost."
      cancelLabel="Keep editing" confirmLabel="Discard changes"
      onConfirm={discard} />
  </div>;
}
