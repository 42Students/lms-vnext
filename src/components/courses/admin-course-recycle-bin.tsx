"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type ArchivedCourse = { id: string; name: string; code: string };
type RecycleResponse = {
  courses: ArchivedCourse[];
  page: number;
  totalPages: number;
  totalElements: number;
};

/** Scoped Deleted Courses directory. Never restores an archived row without
 * a deliberate user confirmation and the existing courses.manage API guard.
 */
export function AdminCourseRecycleBin({ collegeId }: { collegeId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] = useState<RecycleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ArchivedCourse | null>(null);
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const query = new URLSearchParams({
      collegeId, onlyArchived: "true", page: String(page), size: "25",
    });
    void fetch("/api/courses?" + query, {
      cache: "no-store", credentials: "same-origin", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error("Deleted courses could not be loaded.");
      return response.json() as Promise<RecycleResponse>;
    }).then(data => {
      if (!controller.signal.aborted) setRows(data);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setRows(null);
        setError("Deleted courses could not be loaded. Retry to see the saved records.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [collegeId, open, page, revision]);

  async function restore() {
    if (!selected || restoring) return;
    setRestoring(true);
    try {
      await apiFetch("/api/courses/" + encodeURIComponent(selected.id) + "/restore", {
        method: "POST",
      });
      showToast({tone:"success",title:"Course restored",description:selected.name});
      setSelected(null);
      setRevision(value => value + 1);
      router.refresh();
    } catch (cause) {
      showToast({tone:"error",title:"Course could not be restored",
        description:cause instanceof Error ? cause.message : "Please retry."});
    } finally {
      setRestoring(false);
    }
  }

  return <section className="min-w-0 border-t border-border pt-4">
    <Button type="button" variant="secondary" onClick={() => {
      setOpen(value => !value); setPage(1);
    }}>{open ? "Hide Deleted Courses" : "Deleted Courses"}</Button>
    {open ? <div className="mt-4 space-y-3">
      <p className="text-sm text-body">Archived courses keep their history.
        Restoring a course requires its department to be active and its name,
        code and short title to remain unique.</p>
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading Deleted Courses…</p> : null}
      {error ? <p role="alert" className="text-sm text-error">{error}{" "}
        <Button variant="secondary" type="button" size="sm"
          onClick={() => setRevision(value => value + 1)}>Retry</Button>
      </p> : null}
      {!loading && rows ? rows.courses.length ? <>
        <p className="text-xs text-muted-foreground">{rows.totalElements} archived course(s)</p>
        <ul className="divide-y divide-border border-y border-border">
          {rows.courses.map(course => <li key={course.id}
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{course.name}</p>
              <p className="text-xs text-muted-foreground">{course.code}</p>
            </div>
            <Button type="button" variant="secondary" size="sm"
              onClick={() => setSelected(course)}>Restore</Button>
          </li>)}
        </ul>
        {rows.totalPages > 1 ? <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" size="sm" disabled={page === 1}
            onClick={() => setPage(value => Math.max(1,value-1))}>Previous</Button>
          <span className="text-sm">Page {rows.page} of {rows.totalPages}</span>
          <Button type="button" variant="secondary" size="sm"
            disabled={page >= rows.totalPages}
            onClick={() => setPage(value => value+1)}>Next</Button>
        </div> : null}
      </> : <p role="status" className="text-sm text-muted-foreground">
        No deleted courses in this college.
      </p> : null}
    </div> : null}
    <ConfirmDialog open={Boolean(selected)} onOpenChange={value => {
      if (!value && !restoring) setSelected(null);
    }} title="Restore Course" confirmLabel="Restore" confirmVariant="primary"
      pending={restoring} onConfirm={() => void restore()}
      description={selected ? "Restore “" + selected.name + "”? Its previous course history remains unchanged." : undefined} />
  </section>;
}
