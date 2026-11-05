"use client";

import type { listLearnerCourseClassAnnouncements } from "@/modules/courses/learner-course-announcements-service";
import { formatDateWith } from "@/lib/format-date";

type Announcement = Awaited<ReturnType<typeof listLearnerCourseClassAnnouncements>>[number];

export function LearnerCourseAnnouncements({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return (
      <div className="rounded-[var(--lms-card-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-6 text-center text-sm text-[var(--lms-muted-text)]">
        No announcements for this course.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {announcements.map(a => (
        <div key={a.id} className="rounded-[var(--lms-card-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[var(--lms-primary-text)]">{a.title}</p>
            <p className="text-xs text-[var(--lms-muted-text)]">
              {a.senderName ?? "College staff"} &middot;{" "}
              {formatDateWith(new Date(a.createdAt), "en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          {a.messageText ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--lms-body-text)]">{a.messageText}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
