"use client";
import { Button } from "@/components/ui/button";



import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export type SlotFormRow = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  credits: number;
  minPick: number;
  maxPick: number;
  status: string;
};

type Options = {
  programs: { id: string; name: string; durationTerms: number }[];
  periods: { id: string; name: string }[];
};

const fieldClass = "min-h-10 w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-foreground";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">{label}{children}</label>;
}

export function CollegeSlotManager({ options, row }: {
  options: Options;
  row?: SlotFormRow;
}) {
  const editing = Boolean(row);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, transition] = useTransition();
  const [programId, setProgramId] = useState(options.programs[0]?.id ?? "");
  const [periodId, setPeriodId] = useState("");
  const [term, setTerm] = useState("1");
  const [year, setYear] = useState("");
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [credits, setCredits] = useState(String(row?.credits ?? 3));
  const [minPick, setMinPick] = useState(String(row?.minPick ?? 1));
  const [maxPick, setMaxPick] = useState(String(row?.maxPick ?? 1));
  const [error, setError] = useState<string | null>(null);
  const limit = options.programs.find(p => p.id === programId)?.durationTerms ?? 12;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const common = {
      name, description: description.trim() || null,
      credits: Number(credits), minPick: Number(minPick),
      maxPick: Number(maxPick), confirm: true,
    };
    const payload = row
      ? { ...common, expectedVersion: row.version }
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
        if (!response.ok) throw new Error(result?.error || "Unable to save elective slot");
        setOpen(false);
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
    <Button variant="secondary" type="button" disabled={pending || (!editing && options.programs.length === 0)}
      onClick={() => setOpen(!open)}
      className="text-primary-text">
      {row ? "Edit slot" : "New elective slot"}
    </Button>
    {open ? <form onSubmit={submit} className="mt-3 grid max-w-3xl gap-3 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-4 sm:grid-cols-2">
      {row?<p role="note" className="sm:col-span-2 text-xs text-muted-foreground">Academic identity is locked after creation. Changing existing learner picks, credits or choice limits is checked by the server before saving.</p>:null}
      {!row ? <>
        <Field label="Program"><Select required className={fieldClass} value={programId}
          onChange={event => setProgramId(event.target.value)}>
          {options.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select></Field>
        <Field label="Academic period (optional)"><Select className={fieldClass} value={periodId}
          onChange={event => setPeriodId(event.target.value)}>
          <option value="">No period linked</option>
          {options.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select></Field>
        <Field label="Semester number"><input required type="number" min={1} max={Math.min(12, limit)}
          className={fieldClass} value={term} onChange={event => setTerm(event.target.value)} /></Field>
        <Field label="Academic year (optional, YYYY-YY)"><Input maxLength={9}
          placeholder="2026-27" className={fieldClass} value={year}
          onChange={event => setYear(event.target.value)} /></Field>
      </> : null}
      <Field label="Slot name"><Input required maxLength={150} className={fieldClass}
        value={name} onChange={event => setName(event.target.value)} /></Field>
      <Field label="Description"><Input maxLength={1000} className={fieldClass}
        value={description} onChange={event => setDescription(event.target.value)} /></Field>
      <Field label="Credits"><Input type="number" required min={0} max={30}
        className={fieldClass} value={credits} onChange={event => setCredits(event.target.value)} /></Field>
      <Field label="Minimum choices"><Input type="number" required min={0} max={100}
        className={fieldClass} value={minPick} onChange={event => setMinPick(event.target.value)} /></Field>
      <Field label="Maximum choices"><Input type="number" required min={1} max={100}
        className={fieldClass} value={maxPick} onChange={event => setMaxPick(event.target.value)} /></Field>
      {error ? <p role="alert" className="sm:col-span-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3 sm:col-span-2">
        <Button variant="primary" type="submit" disabled={pending}
          >
          {pending ? "Saving…" : editing ? "Confirm update" : "Confirm create"}
        </Button>
        <Button variant="secondary" type="button" disabled={pending} onClick={() => setOpen(false)}
          >
          Cancel
        </Button>
      </div>
    </form> : null}
  </div>;
}
