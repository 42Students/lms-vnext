"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { TERM_MAPPING_COPY, collegeTermCourseAddSchema, collegeTermCourseUpdateSchema, collegeTermMappingErrorMessage } from "@/modules/academics/college-term-mapping-model";

type MappingRead = {
  terms: readonly { id: string; name: string; termNumber: number; programId: string; programName: string; departmentId: string; isActive: boolean }[];
  courses: readonly { id: string; name: string; code: string; departmentId: string }[];
  mapped: readonly {
    id: string; termId: string; courseId: string; termName: string; termNumber: number; programName: string;
    courseName: string; courseCode: string; type: string; credits: number | null; displayOrder: number; staffingWarning: string | null; staffingTooltip?: string | null;
  }[];
};

export function CollegeTermMappingManager({ data }: { data: MappingRead }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [programId, setProgramId] = useState("");
  const [termId, setTermId] = useState("");
  const [draftByTerm, setDraftByTerm] = useState<Record<string, string[]>>({});
  const [confirm, setConfirm] = useState<{ type: "ADD"; body: unknown } | { type: "REMOVE"; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; credits: string; position: string } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  async function send() {
    if (!confirm) return;
    start(async () => {
      try {
        const create = confirm.type === "ADD";
        const url = create ? "/api/academics/semester-course-mappings" :
          "/api/academics/semester-course-mappings/" + encodeURIComponent(confirm.id);
        await apiFetch(url, {
          method: create ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(create ? confirm.body : { confirm: true }),
        });
        const removedCourse = confirm.type === "REMOVE"
          ? data.mapped.find(row => row.id === confirm.id)?.courseName ?? "course" : null;
        const addedCount = confirm.type === "ADD"
          ? ((confirm.body as { mappings?: unknown[] }).mappings?.length ?? 1) : 0;
        setNotice(removedCourse === null
          ? TERM_MAPPING_COPY.addedMessage(addedCount) : TERM_MAPPING_COPY.removedMessage(removedCourse));
        setConfirm(null);
        setError(null);
        if (confirm.type === "ADD") setDraftByTerm(current => ({ ...current, [termId]: [] }));
        router.refresh();
      } catch (cause) {
        setError(cause instanceof FriendlyFetchError && cause.code
          ? collegeTermMappingErrorMessage(cause.code)
          : cause instanceof Error ? cause.message : "Unable to change mapping");
      }
    });
  }

  const termChoices = data.terms.filter(term => term.isActive && term.programId === programId);
  const selectedIds = draftByTerm[termId] ?? [];
  const mappedIds = new Set(data.mapped.filter(item => item.termId === termId).map(item => item.courseId));
  const selectedTerm = data.terms.find(term => term.id === termId);
  const availableCourses = data.courses.filter(course =>
    selectedTerm && course.departmentId === selectedTerm.departmentId && !mappedIds.has(course.id));
  const currentMappings = data.mapped.filter(item => item.termId === termId);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const inputs = selectedIds.map(courseId => collegeTermCourseAddSchema.safeParse({
      programTermId: termId, courseId, type: "CORE", credits: 3,
    }));
    if (!inputs.length || inputs.some(item => !item.success)) {
      setError("Select one or more eligible courses for the semester.");
      return;
    }
    setError(null); setNotice(null);
    setConfirm({ type: "ADD", body: { mappings: inputs.flatMap(item => item.success ? [item.data] : []) } });
  }

  function updateMapping(id: string, creditsValue: string, position: number) {
    const parsed = collegeTermCourseUpdateSchema.safeParse({
      credits: creditsValue.trim() === "" ? 3 : Number(creditsValue), position,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check mapping details.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await apiFetch("/api/academics/semester-course-mappings/" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const previous = data.mapped.find(row => row.id === id);
        const oldPosition = previous ? orderedPeers(previous).findIndex(row => row.id === id) + 1 : position;
        setNotice(oldPosition === position ? "Semester course mapping updated." : "Semester course order saved.");
        setEditing(null);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof FriendlyFetchError && cause.code
          ? collegeTermMappingErrorMessage(cause.code)
          : cause instanceof Error ? cause.message : "Unable to update mapping.");
      }
    });
  }
  function orderedPeers(row: MappingRead["mapped"][number]) {
    return data.mapped
      .filter(peer => peer.termName === row.termName && peer.programName === row.programName && peer.termNumber === row.termNumber)
      .slice().sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
  }

  return <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
    <h2 className="text-lg font-semibold text-foreground">Program semester curriculum mappings</h2>
    <p className="text-sm text-body">Manage the courses assigned to each numbered semester.</p>
    <form onSubmit={prepare} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Program
        <select required value={programId} onChange={event => {
          if(selectedIds.length)setNotice("Unsaved course choices are retained for this semester.");
          setProgramId(event.target.value); setTermId("");
        }} className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground">
          <option value="">Choose program</option>
          {Array.from(new Map(data.terms.map(t => [t.programId, t.programName])).entries()).map(
            ([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Semester
        <select required value={termId} onChange={event => {
          if(selectedIds.length)setNotice("Unsaved course choices are retained.");
          setTermId(event.target.value);
        }} className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground">
          <option value="">Choose semester</option>
          {termChoices.map(t => <option key={t.id} value={t.id}>{t.name} ({t.termNumber})</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Courses to Add
        <select multiple size={8} value={selectedIds}
          disabled={!termId} onChange={event => setDraftByTerm(current => ({
            ...current, [termId]: Array.from(event.target.selectedOptions).map(option => option.value),
          }))} className="min-h-40 rounded-md border border-border bg-surface px-2 text-foreground">
          {availableCourses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
        <span className="text-xs font-normal text-muted-foreground">
          Choose multiple courses; already-mapped courses are excluded. Selection is retained per semester.
        </span>
      </label>
      <div className="flex items-end">
        <Button type="submit" disabled={pending || !termId || !selectedIds.length}>
          {TERM_MAPPING_COPY.addButton}
        </Button>
      </div>
    </form>
    {!termId ? <p className="text-sm text-body">Select a program and semester to view mapped courses.</p> :
    currentMappings.length === 0 ? <p className="text-sm text-body">No courses mapped to this semester.</p> :
      <ScrollCue axis="x" label="Semester course mappings"><table className="w-full min-w-[40rem] text-left text-sm">
        <thead><tr>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.courseName}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.courseCode}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.credits}</th>
          <th scope="col" className="px-2 py-2">Order</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.actions}</th>
        </tr></thead>
        <tbody>{currentMappings.map(row => <tr key={row.id} className="border-t border-border"
          draggable={!pending} onDragStart={event => { setDraggedId(row.id); event.dataTransfer.effectAllowed = "move"; }}
          onDragEnd={() => setDraggedId(null)}
          onDragOver={event => { if (draggedId && draggedId !== row.id) event.preventDefault(); }}
          onDrop={event => {
            event.preventDefault();
            const source = currentMappings.find(item => item.id === draggedId);
            if (source && source.termId === row.termId && source.id !== row.id) {
              const index = orderedPeers(row).findIndex(item => item.id === row.id) + 1;
              updateMapping(source.id, String(source.credits ?? 3), index);
            }
            setDraggedId(null);
          }}>
          <td className="px-2 py-2">
            <span className="font-semibold">{row.courseName}</span>
            {row.staffingWarning && <p role="status" title={row.staffingTooltip ?? undefined} className="mt-1 text-xs font-semibold text-warning">
              {row.staffingWarning}
            </p>}
          </td>
          <td className="px-2 py-2">{row.courseCode}</td>
          <td className="px-2 py-2">{row.credits ?? "—"}</td>
          <td className="px-2 py-2">{orderedPeers(row).findIndex(peer => peer.id === row.id) + 1}</td>
          <td className="px-2 py-2">
            {editing?.id === row.id ? (
              <form aria-label={"Edit mapping for " + row.courseName} className="grid gap-2"
                onSubmit={event => {
                  event.preventDefault();
                  updateMapping(row.id, editing.credits, Number(editing.position));
                }}>
                <label className="text-xs">Credits
                  <input type="number" min={1} max={10} step={1} required value={editing.credits}
                    onChange={event => setEditing({ ...editing, credits: event.target.value })}
                    className="block min-h-11 w-24 rounded border border-border bg-surface px-2" />
                </label>
                <label className="text-xs">Order
                  <input type="number" min={1} max={orderedPeers(row).length} step={1} value={editing.position}
                    onChange={event => setEditing({ ...editing, position: event.target.value })}
                    className="block min-h-11 w-24 rounded border border-border bg-surface px-2" />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={pending}
                    className="min-h-11 rounded border border-border px-2 text-xs font-semibold">Save</button>
                  <button type="button" disabled={pending} onClick={() => setEditing(null)}
                    className="min-h-11 rounded border border-border px-2 text-xs">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} className="min-h-11 rounded border border-border px-2 text-xs"
                  onClick={() => setEditing({
                    id: row.id, credits: row.credits === null ? "3" : String(row.credits),
                    position: String(orderedPeers(row).findIndex(item => item.id === row.id) + 1),
                  })}>Edit</button>
                <button type="button" disabled={pending || orderedPeers(row)[0]?.id === row.id}
                  className="min-h-11 rounded border border-border px-2 text-xs"
                  aria-label={"Move " + row.courseName + " up"}
                  onClick={() => updateMapping(row.id, row.credits === null ? "3" : String(row.credits),
                    orderedPeers(row).findIndex(item => item.id === row.id))}>↑</button>
                <button type="button" disabled={pending || orderedPeers(row).at(-1)?.id === row.id}
                  className="min-h-11 rounded border border-border px-2 text-xs"
                  aria-label={"Move " + row.courseName + " down"}
                  onClick={() => updateMapping(row.id, row.credits === null ? "" : String(row.credits),
                    orderedPeers(row).findIndex(item => item.id === row.id) + 2)}>↓</button>
                <Button size="sm" variant="danger" disabled={pending}
                  onClick={() => { setError(null); setNotice(null); setConfirm({ type: "REMOVE", id: row.id }); }}>
                  {TERM_MAPPING_COPY.removeButton}
                </Button>
              </div>
            )}
          </td>
        </tr>)}</tbody>
      </table></ScrollCue>}
    {notice ? <p role="status" className="text-sm text-body">{notice}</p> : null}
    {error ? <p role="alert" className="text-sm text-[var(--lms-error)]">{error}</p> : null}
    <ConfirmDialog open={confirm !== null} onOpenChange={value => { if (!value && !pending) setConfirm(null); }}
      title={confirm?.type === "REMOVE"
        ? TERM_MAPPING_COPY.removeTitle(data.mapped.find(row => row.id === confirm.id)?.courseName ?? "course")
        : "Add course to semester?"}
      description={confirm?.type === "REMOVE"
        ? "This removes a curriculum mapping. It will be blocked if an active current-term cohort offering uses it."
        : "Confirm the new curriculum association. Duplicate mappings are rejected."}
      confirmVariant={confirm?.type === "REMOVE" ? "danger" : "primary"}
      confirmLabel={confirm?.type === "REMOVE" ? TERM_MAPPING_COPY.removeButton : TERM_MAPPING_COPY.addButton}
      pending={pending} onConfirm={send} />
  </section>;
}
