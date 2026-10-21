"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Button } from "@/components/ui/button";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";

type Course = { id: string; name: string };
type Report = {
  selectedCourses: number;
  matchedLessons: number;
  matchedContents: number;
  changed: number;
  unchanged: number;
  failures: { id: string; reason: string }[];
  failedCourseIds: string[];
};

/**
 * This operation deliberately does NOT archive courses. The underlying
 * ACTIVE/ARCHIVED course lifecycle is different from the legacy independent
 * active+enabled visibility fields. The label and confirmation must never
 * promise course-level hiding until the catalogue/access model supports it.
 */
export function SuperAdminCourseBulkVisibility({ courses }: { courses: readonly Course[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<boolean | null>(null);
  const currentIds = new Set(courses.map((course) => course.id));
  const selectedInScope = selected.filter((id) => currentIds.has(id));
  const currentPageFullySelected = courses.length > 0 &&
    courses.every((course) => selectedInScope.includes(course.id));

  async function apply(visibleToStudents: boolean, candidateIds = selectedInScope) {
    // A previously selected course from a different page or college must
    // never be submitted without a verified current acting-college scope.
    const ids = [...new Set(candidateIds.filter((id) => currentIds.has(id)))];
    if (!ids.length || pending) return;
    if (!window.confirm(
      (visibleToStudents ? "Show" : "Hide") + " published lesson content in " +
      ids.length + " selected course(s) to students? This does not hide the course " +
      "itself or change unpublished and future content.",
    )) return;

    setPending(true);
    setError(null);
    setReport(null);
    setLastAction(visibleToStudents);
    try {
      const data = await apiFetch<Report>("/api/admin/courses/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds: ids, visibleToStudents, confirmed: true }),
      });
      setReport(data);
      // Keep only actionable failures in the current scope after the POST.
      // Unlike content-level failures, this is a course-unit selection.
      setSelected(data.failedCourseIds.filter((id) => currentIds.has(id)));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof FriendlyFetchError &&
        caught.code === "COURSE_VISIBILITY_BULK_TOO_LARGE"
        ? "Too many published lesson items are selected. Select fewer courses and try again."
        : caught instanceof FriendlyFetchError && caught.code === "COURSE_NOT_FOUND"
          ? "One or more selected courses changed. Refresh and select current courses."
          : caught instanceof Error ? caught.message : "Unable to update published content visibility.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Bulk published content visibility" className="space-y-3 border-b border-border pb-5">
      <h3 className="font-semibold text-foreground">Published lesson content visibility</h3>
      <p className="text-sm text-body">
        Show or hide currently published lesson content for students in the selected courses.
        This does not change the course&apos;s active status, unpublished lessons, or future content.
        To hide an entire course, use the course lifecycle and learner access controls.
      </p>
      <label className="flex min-h-11 items-center gap-2 py-2 text-sm">
        <Checkbox
          checked={currentPageFullySelected}
          disabled={pending || !courses.length}
          onChange={(event) => setSelected((previous) => {
            // Retain off-page IDs locally, but never act on them without scoped
            // revalidation. Pagination changes must not silently discard them.
            const offPage = previous.filter((id) => !currentIds.has(id));
            return event.target.checked ? [...offPage, ...courses.map((course) => course.id)] : offPage;
          })}
        />
        Select all courses on this page
      </label>
      <ScrollCue axis="y" label="Bulk course selection" viewportClassName="max-h-48">
        <div className="divide-y divide-border border-y border-border">
          {courses.map((course) => (
            <label key={course.id} className="flex min-h-11 items-center gap-2 text-sm">
              <Checkbox
                checked={selectedInScope.includes(course.id)}
                disabled={pending}
                onChange={(event) => setSelected((previous) => event.target.checked
                  ? [...new Set([...previous, course.id])]
                  : previous.filter((id) => id !== course.id))}
              />
              <span>{course.name}</span>
            </label>
          ))}
        </div>
      </ScrollCue>
      <p className="text-xs text-muted-foreground" role="status">
        {selectedInScope.length} selected on this page
        {selected.length > selectedInScope.length
          ? " · " + (selected.length - selectedInScope.length) + " saved from another page (not included in this action)"
          : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button" variant="primary" loading={pending}
          disabled={!selectedInScope.length || pending}
          onClick={() => void apply(true)}
          className="min-h-11 md:min-h-9"
        >
          {pending ? "Updating…" : "Show published content"}
        </Button>
        <Button
          variant="secondary" type="button" disabled={!selectedInScope.length || pending}
          onClick={() => void apply(false)}
          className="min-h-11 md:min-h-9"
        >
          Hide published content
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {report ? (
        <Alert tone={report.failures.length || report.matchedLessons === 0 ? "warning" : "success"} role="status">
          <p>
            {report.selectedCourses - report.failedCourseIds.length} of {report.selectedCourses} course(s) processed
            · {report.changed} published content item(s) updated
            · {report.unchanged} unchanged · {report.failures.length} lesson failure(s)
          </p>
          <p className="text-xs">
            Scope: {report.matchedLessons} published lesson(s), {report.matchedContents} content item(s).
            The course status itself was not changed.
          </p>
          {report.failedCourseIds.length ? (
            <Button
              type="button" variant="secondary"
              disabled={pending || lastAction === null ||
                !report.failedCourseIds.some((id) => currentIds.has(id))}
              onClick={() => lastAction === null ? undefined :
                void apply(lastAction, report.failedCourseIds)}
              className="min-h-11 md:min-h-9"
            >
              Retry failed courses
            </Button>
          ) : null}
          {report.matchedLessons === 0
            ? <p>No published lesson content is available for the selected courses.</p>
            : null}
        </Alert>
      ) : null}
    </section>
  );
}
