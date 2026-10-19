import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOwnLearnerCourseProgressBreakdown } from "@/modules/courses/learner-course-drilldown-service";
import { courseSectionDeliveryIdSchema } from "@/modules/courses/validation";

function tone(status: string): "success" | "warning" | "neutral" | "info" {
  if (status === "COMPLETED") return "success";
  if (status === "MISSED") return "warning";
  if (status === "IN_PROGRESS") return "info";
  return "neutral";
}

export default async function LearnerCourseProgressPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  if (!courseSectionDeliveryIdSchema.safeParse(deliveryId).success) notFound();
  const context = await getCurrentRequestContext();
  const progress = await getOwnLearnerCourseProgressBreakdown(context, deliveryId);
  if (!progress) notFound();

  return (
    <div className="min-w-0 space-y-6">
      <Link href={"/learn/courses/" + encodeURIComponent(deliveryId) + "/home"}
        className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Course overview
      </Link>
      <PageHeader title="Course progress by lesson" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Progress summary">
        {[
          { label: "Overall", value: progress.summary.overallPercent + "%" },
          { label: "Lessons", value: progress.summary.lessonsCompleted + "/" + progress.summary.lessonsTotal },
          { label: "Assignments", value: progress.summary.assignmentsCompleted + "/" + progress.summary.assignmentsTotal },
          { label: "Quizzes", value: progress.summary.quizzesCompleted + "/" + progress.summary.quizzesTotal },
        ].map((metric) => (
          <article key={metric.label} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-xs font-semibold text-muted-foreground">{metric.label}</h2>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{metric.value}</p>
          </article>
        ))}
      </section>
      {!progress.learningPathPublished ? (
        <section role="status" className="border-b border-border py-4">
          <h2 className="font-semibold text-foreground">Learning path not published</h2>
          <p className="mt-2 text-sm text-body">
            Your college has not published a learning path for this delivery.
            Zero published items is not evidence of course completion.
          </p>
        </section>
      ) : progress.lessons.length === 0 ? (
        <section role="status" className="border-b border-border py-4">
          <h2 className="font-semibold text-foreground">No published lessons</h2>
          <p className="mt-2 text-sm text-body">Lesson progress will appear after course content is published.</p>
        </section>
      ) : (
        <section className="space-y-4" aria-label="Lesson completion">
          {progress.lessons.map((lesson) => (
            <article key={lesson.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">{lesson.name}</h2>
                  <p className="mt-1 text-sm text-body">
                    {lesson.total === 0
                      ? "No published learning items"
                      : lesson.completed + " of " + lesson.total + " items completed"}
                    {lesson.missed ? " · " + lesson.missed + " missed" : ""}
                  </p>
                </div>
                <StatusBadge tone={lesson.total === 0 ? "neutral" :
                  lesson.completed === lesson.total ? "success" : "info"}>
                  {lesson.percentage === null ? "No items" : lesson.percentage + "%"}
                </StatusBadge>
              </div>
              {lesson.percentage !== null ? (
                <div role="progressbar" aria-label={lesson.name + " completion"}
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={lesson.percentage}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary"
                    style={{ width: lesson.percentage + "%" }} />
                </div>
              ) : null}
              {lesson.items.length ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {lesson.items.map((item) => (
                    <li key={item.kind + ":" + item.id}
                      className="flex min-w-0 items-start justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border p-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.kind.toLowerCase()}
                        </p>
                      </div>
                      <StatusBadge tone={tone(item.status)}>
                        {item.status.replaceAll("_", " ")}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href={"/learn/courses/" + encodeURIComponent(deliveryId) +
                  "/roadmap?lesson=" + encodeURIComponent(lesson.id)}
                className="mt-4 inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
                Open in learning path →
              </Link>
            </article>
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Completion is computed from persisted learner progress and submitted assessments.
        Unpublished grades and untracked attendance are not inferred.
      </p>
    </div>
  );
}
