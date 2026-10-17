"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
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
};

async function mutate(method: "POST" | "PATCH" | "DELETE", url: string, body: unknown) {
  return apiFetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function CollegeSemesterCreateForm({ programs }: { programs: ProgramOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [termNumber, setTermNumber] = useState("1");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const parsed = createCollegeSemesterSchema.safeParse({
      programId, termNumber: Number(termNumber), name,
      totalCredits: null,
    });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Check semester details.");
      return;
    }
    startTransition(async () => {
      try {
        await mutate("POST", "/api/academics/semesters", parsed.data);
        setName("");
        setNotice(SEMESTER_COPY.createdMessage(parsed.data.name));
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, SEMESTER_COPY.createFailed));
      }
    });
  }

  return (
    <section aria-label={SEMESTER_COPY.createTitle} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="m-0 text-lg font-semibold text-foreground">{SEMESTER_COPY.createTitle}</h2>
      {programs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Create a program before adding semesters.</p>
      ) : (
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1 text-sm font-medium text-body">
            {SEMESTER_COPY.programLabel}
            <select required value={programId} onChange={e => setProgramId(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              {programs.map(program => <option key={program.id} value={program.id}>
                {program.name} ({program.code})
              </option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-body">
            {SEMESTER_COPY.numberLabel}
            <input required type="number" min={1} max={12} step={1} value={termNumber} placeholder={SEMESTER_COPY.numberPlaceholder}
              onChange={e => setTermNumber(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-body">
            {SEMESTER_COPY.nameLabel}
            <input required maxLength={255} value={name} onChange={e => setName(e.target.value)} placeholder={SEMESTER_COPY.namePlaceholder}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <p className="self-center text-xs text-body">
            Total credits are calculated from courses mapped to this semester.
          </p>
          <div className="flex items-end">
            <button type="submit" disabled={pending}
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
              {pending ? "Saving…" : SEMESTER_COPY.createButton}
            </button>
          </div>
        </form>
      )}
      {notice ? <p role="status" className="mt-3 text-sm text-body">{notice}</p> : null}
    </section>
  );
}

export function CollegeSemesterRowActions({ row }: { row: SemesterRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(row.name);
  const [isActive, setIsActive] = useState(row.isActive);
  const [notice, setNotice] = useState("");
  const url = "/api/academics/semesters/" + encodeURIComponent(row.id);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const parsed = updateCollegeSemesterSchema.safeParse({
      name, totalCredits: null, isActive,
      expectedUpdatedAt:row.updatedAt.toISOString(),confirm:true,
    });
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Check semester details.");
      return;
    }

    startTransition(async () => {
      try {
        await mutate("PATCH", url, parsed.data);
        setEditing(false);
        setNotice(SEMESTER_COPY.updatedMessage);
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, SEMESTER_COPY.updateFailed));
      }
    });
  }

  function remove() {
    setNotice("");
    startTransition(async () => {
      try {
        await mutate("DELETE", url, { confirm: true });
        setConfirming(false);
        setNotice(SEMESTER_COPY.deletedMessage);
        router.refresh();
      } catch (error) {
        setNotice(academicSetupErrorMessage(error, SEMESTER_COPY.deleteFailed));
      }
    });
  }

  return (
    <div className="min-w-52 space-y-2">
      {!editing && !confirming ? (
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => { setNotice(""); setEditing(true); }}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
            Edit
          </button>
          <button type="button" disabled={pending} onClick={() => { setNotice(""); setConfirming(true); }}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
            Delete
          </button>
        </div>
      ) : null}
      {editing ? (
        <form onSubmit={save} className="space-y-2">
          <h3 className="m-0 text-sm font-semibold text-foreground">{SEMESTER_COPY.editTitle}</h3>
          <p className="text-xs text-muted-foreground">{SEMESTER_COPY.promotionNote}</p>
          <label className="grid gap-1 text-xs font-semibold text-body">
            {SEMESTER_COPY.nameLabel}
            <input required maxLength={255} value={name} onChange={e => setName(e.target.value)}
              className="min-h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground" />
          </label>
          <p className="text-xs text-body">Credits come from mapped courses and cannot be edited here.</p>
          <label className="flex items-center gap-2 text-xs text-body">
            {SEMESTER_COPY.statusLabel}
            <input type="checkbox" role="switch" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            {isActive ? SEMESTER_COPY.statusActive : SEMESTER_COPY.statusInactive}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="min-h-10 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary disabled:opacity-50">
              {pending ? "Saving…" : SEMESTER_COPY.saveButton}
            </button>
            <button type="button" disabled={pending} onClick={() => setEditing(false)}
              className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text">
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {confirming ? (
        <div role="group" aria-label={"Confirm delete semester " + row.name} className="space-y-2 rounded-md border border-border p-2">
          <p className="text-xs font-semibold text-foreground">{SEMESTER_COPY.deleteTitle}</p>
          <p className="text-xs text-body">{SEMESTER_COPY.deleteBlocked}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending || row.mappedCourses > 0} onClick={remove}
              className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-foreground disabled:opacity-50">
              {pending ? "Deleting…" : "Confirm delete"}
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirming(false)}
              className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {notice ? <p role="status" className="text-xs text-body">{notice}</p> : null}
    </div>
  );
}
