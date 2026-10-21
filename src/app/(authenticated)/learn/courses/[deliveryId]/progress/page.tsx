import { MetricBar } from "@/components/ui/metric-bar";
import progressStyles from "@/components/courses/learner-course-progress.module.css";
import { EmptyState } from "@/components/ui/empty-state";
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
        className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        ← Course overview
      </Link>
      <PageHeader title="Course progress by lesson" />
      <section aria-label="Progress summary" className="border-y border-border py-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
          {[
            { label: "Overall", value: progress.summary.overallPercent + "%" },
            { label: "Lessons", value: progress.summary.lessonsCompleted + "/" + progress.summary.lessonsTotal },
            { label: "Assignments", value: progress.summary.assignmentsCompleted + "/" + progress.summary.assignmentsTotal },
            { label: "Quizzes", value: progress.summary.quizzesCompleted + "/" + progress.summary.quizzesTotal },
          ].map((metric) => (
            <div key={metric.label} className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1 break-words text-2xl font-semibold tabular-nums text-foreground">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {!progress.learningPathPublished ? (
        <EmptyState title="Learning path not published"
          description="Your college has not published a learning path for this delivery. Zero published items is not evidence of course completion." />
      ) : progress.lessons.length === 0 ? (
        <EmptyState title="No published lessons"
          description="Lesson progress will appear after course content is published." />
      ) : (
        <section className="space-y-4" aria-label="Lesson completion">
          {progress.lessons.map((lesson) => (
            <article key={lesson.id} className="border-b border-border py-4 md:py-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">{lesson.name}</h2>
                  <p className="mt-1 text-sm text-body leading-[22px]">
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
                <MetricBar className={progressStyles.track+" mt-3"} role="progressbar"
                  label={lesson.name + " completion"} value={lesson.percentage} maximum={100} unit="percent" />
              ) : null}
              {lesson.items.length ? (
                <ul className="mt-3 divide-y divide-border">
                  {lesson.items.map((item) => (
                    <li key={item.kind + ":" + item.id}
                      className="flex min-w-0 flex-col items-start justify-between gap-2 py-3 sm:flex-row sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-foreground leading-[22px]">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-5">
                          {item.kind.toLowerCase()}
                          {item.kind==="CONTENT"?
                            " · Current attempt "+(progress.attemptByContent[item.id]??1):""}
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
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-[var(--lms-control-height)] text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                Open in learning path →
              </Link>
            </article>
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground leading-5">
        Completion reflects the latest recorded content attempt. An authorized
        administrator may start a retake without deleting earlier attempts;
        previous completions remain in history. Unpublished grades and
        untracked attendance are not inferred.
      </p>
    </div>
  );
}
