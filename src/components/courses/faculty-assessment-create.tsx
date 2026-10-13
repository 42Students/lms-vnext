"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Select } from "@/components/ui/select";
import { FacultyLessonAuthoring } from "./faculty-lesson-authoring";
import type { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";

type LessonChoice = Awaited<ReturnType<typeof getFacultyAssessmentOverview>>["lessonChoices"][number];

export function FacultyAssessmentCreate({
  kind,
  lessons,
}: {
  kind: "ASSIGNMENT" | "QUIZ";
  lessons: readonly LessonChoice[];
}) {
  const [open, setOpen] = useState(false);
  const [lessonKey, setLessonKey] = useState("");
  const current = lessons.find((lesson) =>
    lesson.deliveryId + ":" + lesson.lessonId === lessonKey
  ) ?? lessons[0];
  const name = kind === "QUIZ" ? "Quiz" : "Assignment";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div>
          <h2 className="font-semibold text-foreground">Create {name}</h2>
          <p className="mt-1 text-sm text-body">
            Choose an assigned teaching Section and lesson. New assessments start as private drafts.
          </p>
        </div>
        <Button disabled={lessons.length === 0} onClick={() => setOpen(true)}>
          + Create {name}
        </Button>
      </div>
      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No editable lessons are available. Open your teaching Course to add a lesson first.
        </p>
      ) : null}
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={"Create " + name}
        description="Course and Section access are verified again when the draft is saved."
      >
        <label className="block text-sm font-semibold text-body">
          Teaching Course / Section / Lesson
          <Select
            aria-label="Choose assessment lesson"
            className="mt-1.5"
            value={current ? current.deliveryId + ":" + current.lessonId : ""}
            onChange={(event) => setLessonKey(event.target.value)}
          >
            {lessons.map((lesson) => {
              const key = lesson.deliveryId + ":" + lesson.lessonId;
              return (
                <option key={key} value={key}>
                  {lesson.courseCode} · {lesson.courseName} · {lesson.sectionName} · {lesson.lessonName}
                </option>
              );
            })}
          </Select>
        </label>
        {current && open ? (
          <FacultyLessonAuthoring
            key={current.deliveryId + ":" + current.lessonId + ":" + kind}
            lessonId={current.lessonId}
            deliveryId={current.deliveryId}
            initialMode={kind}
            availableModes={[kind]}
            nextContentSequence={current.nextSequence}
            nextAssignmentSequence={current.nextSequence}
            nextQuizSequence={current.nextSequence}
          />
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Drafts remain Section-scoped and are not visible to learners until published. Shared-Offering items require authorized administration.
        </p>
      </Drawer>
    </>
  );
}
