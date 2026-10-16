"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TERM_MAPPING_COPY, collegeTermCourseAddSchema, collegeTermCourseUpdateSchema, collegeTermMappingErrorMessage } from "@/modules/academics/college-term-mapping-model";

type MappingRead = {
  terms: readonly { id: string; name: string; termNumber: number; programName: string; isActive: boolean }[];
  courses: readonly { id: string; name: string; code: string }[];
  mapped: readonly {
    id: string; termName: string; termNumber: number; programName: string;
    courseName: string; courseCode: string; type: string; credits: number | null; displayOrder: number;
  }[];
};

export function CollegeTermMappingManager({ data }: { data: MappingRead }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [termId, setTermId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [kind, setKind] = useState<"CORE" | "ELECTIVE">("CORE");
  const [credits, setCredits] = useState("");
  const [confirm, setConfirm] = useState<{ type: "ADD"; body: unknown } | { type: "REMOVE"; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; credits: string; position: string } | null>(null);

  async function send() {
    if (!confirm) return;
    start(async () => {
      try {
        const create = confirm.type === "ADD";
        const url = create ? "/api/academics/semester-course-mappings" :
          "/api/academics/semester-course-mappings/" + encodeURIComponent(confirm.id);
        const response = await fetch(url, {
          method: create ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(create ? confirm.body : { confirm: true }),
        });
        if (!response.ok) {
          const body: { error?: string } | null = await response.json().catch(() => null);
          throw new Error(collegeTermMappingErrorMessage(body?.error ?? ""));
        }
        const removedCourse = confirm.type === "REMOVE"
          ? data.mapped.find(row => row.id === confirm.id)?.courseName ?? "course" : null;
        setNotice(removedCourse === null
          ? TERM_MAPPING_COPY.addedMessage(1) : TERM_MAPPING_COPY.removedMessage(removedCourse));
        setConfirm(null);
        setError(null);
        setCredits("");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to change mapping");
      }
    });
  }

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = collegeTermCourseAddSchema.safeParse({
      programTermId: termId, courseId, type: kind,
      credits: credits === "" ? null : Number(credits),
    });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? "Check mapping details");
      return;
    }
    setError(null);
    setNotice(null);
    setConfirm({ type: "ADD", body: input.data });
  }


  function updateMapping(id: string, creditsValue: string, position: number) {
    const parsed = collegeTermCourseUpdateSchema.safeParse({
      credits: creditsValue.trim() === "" ? null : Number(creditsValue), position,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check mapping details.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        const response = await fetch("/api/academics/semester-course-mappings/" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!response.ok) {
          const body: { error?: string } | null = await response.json().catch(() => null);
          throw new Error(collegeTermMappingErrorMessage(body?.error ?? ""));
        }
        setNotice("Semester course mapping updated.");
        setEditing(null);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to update mapping.");
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
    <p className="text-sm text-body">These are actual numbered program terms, separate from offering-to-period deliveries below.</p>
    <form onSubmit={prepare} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="grid gap-1 text-sm font-semibold text-body">Semester
        <select required value={termId} onChange={event => setTermId(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground">
          <option value="">Choose semester</option>
          {data.terms.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>
            {t.programName} · {t.name} ({t.termNumber})
          </option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Course
        <select required value={courseId} onChange={event => setCourseId(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground">
          <option value="">Choose course</option>
          {data.courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">{TERM_MAPPING_COPY.courseTypeLabel}
        <select value={kind} onChange={event => setKind(event.target.value as "CORE" | "ELECTIVE")}
          className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground">
          <option value="CORE">{TERM_MAPPING_COPY.core}</option><option value="ELECTIVE">{TERM_MAPPING_COPY.elective}</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Credits (optional)
        <input type="number" min={0} max={30} step={1} value={credits}
          onChange={event => setCredits(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground" />
      </label>
      <div className="flex items-end"><Button type="submit" disabled={pending || !termId || !courseId}>{TERM_MAPPING_COPY.addButton}</Button></div>
    </form>
    {data.mapped.length === 0 ? <p className="text-sm text-body">No curriculum mappings have been saved.</p> :
      <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm">
        <thead><tr>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.semester}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.courseName}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.courseCode}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.type}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.credits}</th>
          <th scope="col" className="px-2 py-2">{TERM_MAPPING_COPY.columns.actions}</th>
        </tr></thead>
        <tbody>{data.mapped.map(row => <tr key={row.id} className="border-t border-border">
          <td className="px-2 py-2">{row.programName} · {row.termName} ({row.termNumber})</td>
          <td className="px-2 py-2">{row.courseName}</td>
          <td className="px-2 py-2">{row.courseCode}</td>
          <td className="px-2 py-2">{row.type === "ELECTIVE" ? TERM_MAPPING_COPY.elective : TERM_MAPPING_COPY.core}</td>
          <td className="px-2 py-2">{row.credits ?? "—"}</td>
          <td className="px-2 py-2">
            {editing?.id === row.id ? (
              <form aria-label={"Edit mapping for " + row.courseName} className="grid gap-2"
                onSubmit={event => {
                  event.preventDefault();
                  updateMapping(row.id, editing.credits, Number(editing.position));
                }}>
                <label className="text-xs">Credits
                  <input type="number" min={0} max={30} step={1} value={editing.credits}
                    onChange={event => setEditing({ ...editing, credits: event.target.value })}
                    className="block min-h-9 w-24 rounded border border-border bg-surface px-2" />
                </label>
                <label className="text-xs">Order
                  <input type="number" min={1} max={orderedPeers(row).length} step={1} value={editing.position}
                    onChange={event => setEditing({ ...editing, position: event.target.value })}
                    className="block min-h-9 w-24 rounded border border-border bg-surface px-2" />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={pending}
                    className="min-h-9 rounded border border-border px-2 text-xs font-semibold">Save</button>
                  <button type="button" disabled={pending} onClick={() => setEditing(null)}
                    className="min-h-9 rounded border border-border px-2 text-xs">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} className="min-h-9 rounded border border-border px-2 text-xs"
                  onClick={() => setEditing({
                    id: row.id, credits: row.credits === null ? "" : String(row.credits),
                    position: String(orderedPeers(row).findIndex(item => item.id === row.id) + 1),
                  })}>Edit</button>
                <button type="button" disabled={pending || orderedPeers(row)[0]?.id === row.id}
                  className="min-h-9 rounded border border-border px-2 text-xs"
                  aria-label={"Move " + row.courseName + " up"}
                  onClick={() => updateMapping(row.id, row.credits === null ? "" : String(row.credits),
                    orderedPeers(row).findIndex(item => item.id === row.id))}>↑</button>
                <button type="button" disabled={pending || orderedPeers(row).at(-1)?.id === row.id}
                  className="min-h-9 rounded border border-border px-2 text-xs"
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
      </table></div>}
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
