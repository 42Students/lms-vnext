"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { collegeTermCourseAddSchema, collegeTermMappingErrorMessage } from "@/modules/academics/college-term-mapping-model";

type MappingRead = {
  terms: readonly { id: string; name: string; termNumber: number; programName: string; isActive: boolean }[];
  courses: readonly { id: string; name: string; code: string }[];
  mapped: readonly {
    id: string; termName: string; termNumber: number; programName: string;
    courseName: string; courseCode: string; type: string; credits: number | null;
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
    setConfirm({ type: "ADD", body: input.data });
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
      <label className="grid gap-1 text-sm font-semibold text-body">Type
        <select value={kind} onChange={event => setKind(event.target.value as "CORE" | "ELECTIVE")}
          className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground">
          <option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Credits (optional)
        <input type="number" min={0} max={30} step={1} value={credits}
          onChange={event => setCredits(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-surface px-2 text-foreground" />
      </label>
      <div className="flex items-end"><Button type="submit" disabled={pending || !termId || !courseId}>Review mapping</Button></div>
    </form>
    {data.mapped.length === 0 ? <p className="text-sm text-body">No curriculum mappings have been saved.</p> :
      <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm">
        <thead><tr>
          <th scope="col" className="px-2 py-2">Semester</th>
          <th scope="col" className="px-2 py-2">Course</th>
          <th scope="col" className="px-2 py-2">Type / credits</th>
          <th scope="col" className="px-2 py-2">Action</th>
        </tr></thead>
        <tbody>{data.mapped.map(row => <tr key={row.id} className="border-t border-border">
          <td className="px-2 py-2">{row.programName} · {row.termName} ({row.termNumber})</td>
          <td className="px-2 py-2">{row.courseName} ({row.courseCode})</td>
          <td className="px-2 py-2">{row.type} · {row.credits ?? "not configured"}</td>
          <td className="px-2 py-2"><Button size="sm" variant="danger"
            disabled={pending} onClick={() => { setError(null); setConfirm({ type: "REMOVE", id: row.id }); }}>Unmap</Button></td>
        </tr>)}</tbody>
      </table></div>}
    {error ? <p role="alert" className="text-sm text-[var(--lms-error)]">{error}</p> : null}
    <ConfirmDialog open={confirm !== null} onOpenChange={value => { if (!value && !pending) setConfirm(null); }}
      title={confirm?.type === "REMOVE" ? "Unmap semester course?" : "Add course to semester?"}
      description={confirm?.type === "REMOVE"
        ? "This removes a curriculum mapping. It will be blocked if an active current-term cohort offering uses it."
        : "Confirm the new curriculum association. Duplicate mappings are rejected."}
      confirmVariant={confirm?.type === "REMOVE" ? "danger" : "primary"}
      confirmLabel={confirm?.type === "REMOVE" ? "Unmap course" : "Add mapping"}
      pending={pending} onConfirm={send} />
  </section>;
}
