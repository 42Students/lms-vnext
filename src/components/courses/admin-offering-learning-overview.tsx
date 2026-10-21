"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Drawer} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@/components/ui/disclosure";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { summarizeCollegeCourseContents } from "@/modules/courses/college-course-contents-summary-model";
import type {
  getAdminOfferingLearningWorkspace,
} from "@/modules/courses/admin-offering-learning-workspace";
import { FacultyLessonAuthoring } from "./faculty-lesson-authoring";
import { CollegeLessonReorderActions } from "./college-lesson-reorder-actions";
import {CollegeLessonDragOrder} from "./college-lesson-drag-order";
import {CollegeLessonVisibilityControl} from "./college-lesson-visibility-controls";
import { FacultyItemActions } from "./faculty-item-actions";
import {
  AdminQuizResultsActions,
  CreateLearningPathPanel,
  CreateLessonForm,
  LearningPathActions,
  LessonActions,
} from "./admin-learning-structure-actions";

type Workspace = Awaited<
  ReturnType<
    typeof getAdminOfferingLearningWorkspace
  >
>;

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "DRAFT":
      return "warning" as const;
    case "CLOSED":
    case "ARCHIVED":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function formatDateTime(
  value: Date | string | null,
) {
  if (!value) return null;
  const date =
    value instanceof Date
      ? value
      : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** The historic API sometimes serialized createdAt as a Java LocalDateTime
 * array. Preserve its calendar day as an IST wall date rather than feeding
 * the raw array to Date.parse or accidentally shifting it across midnight.
 */
function lessonCreatedOn(value:Date|string|readonly number[]|null|undefined){
 if(!value)return "—";
 let date:Date;
 if(Array.isArray(value)){
  const [year,month,day]=value;
  if(!year||!month||!day||month<1||month>12||day<1||day>31)return "—";
  date=new Date(Date.UTC(year,month-1,day,12));
 }else{
  date=value instanceof Date?value:new Date(value as string);
 }
 return Number.isNaN(date.getTime())?"—":
  new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(date);
}

function ContentCard({
  item,
}: {
  item: Workspace["lessons"][number]["contents"][number];
}) {
  const actions = [
    ...(item.status === "DRAFT"
      ? (["PUBLISH"] as const)
      : []),
    ...(item.status !== "ARCHIVED"
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="border-b border-[var(--lms-canvas-border)] py-4 last:border-b-0">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info">
              {item.contentType.replaceAll(
                "_",
                " ",
              )}
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              Shared Offering
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          #{item.sequence + 1}
        </span>
      </div>

      {item.notes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {item.notes}
        </p>
      ) : null}

      {item.externalUrl ? (
        <a
          href={item.externalUrl}
          
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        >
          Open link ↗
        </a>
      ) : null}

      {item.contentType === "LIVE_CLASS" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {formatDateTime(item.startsAt)} →{" "}
          {formatDateTime(item.endsAt)}
        </p>
      ) : null}

      <FacultyItemActions
        transitionUrl={
          "/api/courses/lesson-contents/" +
          item.id +
          "/transition"
        }
        actions={actions}
      />
    </article>
  );
}

function AssignmentCard({
  item,
}: {
  item: Workspace["lessons"][number]["assignments"][number];
}) {
  const actions = [
    ...(item.status === "DRAFT"
      ? (["PUBLISH"] as const)
      : []),
    ...(item.status !== "ARCHIVED"
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="border-b border-[var(--lms-canvas-border)] py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="warning">
              Assignment
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              Shared Offering
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.maxPoints} points
        </span>
      </div>

      {item.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {item.description}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        {item.dueAt
          ? "Due " +
            formatDateTime(item.dueAt)
          : "No deadline"}
      </p>

      <FacultyItemActions
        transitionUrl={
          "/api/courses/assignments/" +
          item.id +
          "/transition"
        }
        actions={actions}
      />
    </article>
  );
}

function QuizCard({
  item,
}: {
  item: Workspace["lessons"][number]["quizzes"][number];
}) {
  const actions = [
    ...(item.status === "DRAFT"
      ? (["PUBLISH"] as const)
      : []),
    ...(item.status === "PUBLISHED"
      ? (["CLOSE"] as const)
      : []),
    ...(item.status !== "ARCHIVED"
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article className="border-b border-[var(--lms-canvas-border)] py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info">
              Quiz
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              Shared Offering
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.totalPoints} points
        </span>
      </div>

      {item.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
          {item.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span>
          {item.maxAttempts} attempt
          {item.maxAttempts === 1 ? "" : "s"}
        </span>
        <span>
          {item.dueAt
            ? "Due " +
              formatDateTime(item.dueAt)
            : "No deadline"}
        </span>
        <span>
          {item.resultsPublished
            ? "Results published"
            : "Results hidden"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <FacultyItemActions
          transitionUrl={
            "/api/courses/quizzes/" +
            item.id +
            "/transition"
          }
          actions={actions}
        />
        <AdminQuizResultsActions
          quizId={item.id}
          status={item.status}
          resultsPublished={
            item.resultsPublished
          }
        />
      </div>
    </article>
  );
}

export function AdminOfferingLearningOverview({
  workspace,
}: {
  workspace: Workspace;
}) {
  const { offering, learningPath } = workspace;
  const router=useRouter();
  const [createOpen,setCreateOpen]=useState(false);
  const [focusedLessonId,setFocusedLessonId]=useState<string|null>(null);
  const previousCount=useRef(workspace.lessons.length);
  // The source-offering may change without remounting this client boundary.
  // Dismiss stale lesson detail before navigating another course.
  useEffect(()=>{setFocusedLessonId(null);setCreateOpen(false);},[offering.id,learningPath?.id]);
  useEffect(()=>{
   if(workspace.lessons.length>previousCount.current&&createOpen)setCreateOpen(false);
   previousCount.current=workspace.lessons.length;
  },[workspace.lessons.length,createOpen]);
  const focusedIndex=focusedLessonId===null?-1:
   workspace.lessons.findIndex(lesson=>lesson.id===focusedLessonId);
  const visibleLessons=focusedIndex<0?[]:[workspace.lessons[focusedIndex]!];

  if (!learningPath) {
    return (
      <div className="space-y-6">
        <section className="border-b border-border pb-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info">
              {offering.type}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {offering.cohortName}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {offering.academicPeriodName}
            </StatusBadge>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-foreground">
            Shared learning structure
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            No active Learning Path exists for
            this Offering yet. Create one before
            adding Lessons or shared learning
            items.
          </p>
        </section>
        <CreateLearningPathPanel
          offeringId={offering.id}
          defaultTitle={
            offering.courseName +
            " Learning Path"
          }
        />
      </div>
    );
  }

  const nextLessonSequence =
    workspace.lessons.reduce(
      (max, lesson) =>
        Math.max(
          max,
          lesson.sequence + 1,
        ),
      0,
    );

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <section className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="info">
                {offering.type}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {offering.cohortName}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {offering.academicPeriodName}
              </StatusBadge>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              Shared Learning Path
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {learningPath.title}
            </h2>
            {learningPath.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-body">
                {learningPath.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              tone={statusTone(
                learningPath.status,
              )}
            >
              {learningPath.status}
            </StatusBadge>
            <LearningPathActions
              learningPath={learningPath}
            />
          </div>
        </div>
        <div className="mt-4 rounded-[var(--lms-control-radius)] bg-surface-subtle px-3 py-2 text-xs leading-5 text-muted-foreground">
          Items created here are shared across
          every active Section Delivery in this
          Offering. Faculty can add separate
          Section-specific items from their
          Teaching Course workspace. <a href="#section-content"
           className="font-semibold text-primary-text underline underline-offset-2">
           View shared and Section-specific content for a class
          </a>.
        </div>
      </section>

      <section aria-label="In this course" className="min-w-0 border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-foreground">In this course</h2>
        <p className="mt-1 text-sm text-muted-foreground">Recorded shared learning items only. Visibility and publication are separate controls.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {summarizeCollegeCourseContents(workspace.lessons).map(item=>(
            <StatTile key={item.key} label={item.label} value={item.count} className="p-3" />
          ))}
        </div>
      </section>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2 text-xl font-semibold text-[var(--lms-heading)]">
          <span aria-hidden="true" className="h-6 w-1 rounded bg-[#e9a23b]"/>
          Lessons
        </h2>
        <div id="lesson-authoring" className="flex flex-wrap items-center gap-3">
       <Button type="button" onClick={()=>setCreateOpen(true)}
        className="min-h-11 md:min-h-9">
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 4v16M4 12h16"/>
          </svg>
          Create New
        </span>
       </Button>
       <Button type="button" variant="secondary" onClick={()=>router.refresh()}
        className="min-h-11 md:min-h-9">Refresh lessons</Button>
       <Drawer open={createOpen} onOpenChange={setCreateOpen} side="right"
        title="Add Lesson" description={offering.courseName+" · "+offering.academicPeriodName}
        footer={<Button type="button" variant="secondary" onClick={()=>{setCreateOpen(false);router.refresh();}}
          className="min-h-11 md:min-h-9">Cancel and refresh</Button>}>
        <CreateLessonForm learningPathId={learningPath.id} nextSequence={nextLessonSequence}/>
       </Drawer>
        </div>
      </div>

      {workspace.lessons.length === 0 ? (
        <section className="flex min-h-40 flex-col items-center justify-center border-y border-border py-7 text-center" aria-label="No lessons">
          <svg aria-hidden="true" width="60" height="48" viewBox="0 0 60 48"
           fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <rect x="8" y="8" width="44" height="32" rx="3"/><path d="M18 17h24M18 24h19M18 31h14"/>
          </svg>
          <h3 className="mt-3 text-sm font-semibold text-foreground">No Lessons yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Click Create New to add your first Lesson.</p>
        </section>
      ) : (
        <div className="min-w-0 space-y-[var(--lms-space-4)]">
          {focusedIndex<0?<CollegeLessonDragOrder learningPathId={learningPath.id}
            lessons={workspace.lessons.map(row=>({id:row.id,name:row.name,sequence:row.sequence}))}/>:null}
          {focusedIndex<0?(
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
              {workspace.lessons.map((lesson,index)=>{
                const itemCount=lesson.contents.length+lesson.assignments.length+lesson.quizzes.length;
                return <button type="button" key={lesson.id}
                  aria-label={"Open lesson "+(lesson.name.trim()||"Untitled lesson")}
                  className="group flex min-h-48 min-w-0 flex-col items-start rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                  onClick={()=>setFocusedLessonId(lesson.id)}>
                  <p className="text-xs font-semibold text-primary-text">Lesson {index+1}</p>
                  <h3 className="mt-3 break-words text-[26px] font-semibold leading-[1.25] capitalize text-[var(--lms-heading)]">
                    {lesson.name.trim()||"Untitled lesson"}
                  </h3>
                  <p className="mt-auto pt-4 text-sm text-muted-foreground">
                    Created on {lessonCreatedOn(lesson.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{itemCount} items</p>
                  <span className="mt-3 text-sm font-semibold text-primary-text group-hover:underline">
                    Open lesson →
                  </span>
                </button>;
              })}
            </div>
          ):(
            <nav aria-label="Lesson roadmap" className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={()=>setFocusedLessonId(null)}
               className="min-h-11 md:min-h-9">← Back to syllabus</Button>
              <Button type="button" variant="secondary" disabled={focusedIndex===0}
               onClick={()=>setFocusedLessonId(workspace.lessons[focusedIndex-1]?.id??null)}
               className="min-h-11 md:min-h-9">Previous lesson</Button>
              <Button type="button" variant="secondary" disabled={focusedIndex===workspace.lessons.length-1}
               onClick={()=>setFocusedLessonId(workspace.lessons[focusedIndex+1]?.id??null)}
               className="min-h-11 md:min-h-9">Next lesson</Button>
            </nav>
          )}
          {focusedIndex>=0?visibleLessons.map(
            (lesson, visibleIndex) => {
              const lessonIndex=focusedIndex<0?visibleIndex:focusedIndex;
              const itemCount =
                lesson.contents.length +
                lesson.assignments.length +
                lesson.quizzes.length;

              return (
                <section
                  id={"lesson-"+lesson.id}
                  key={lesson.id}
                  className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                        Lesson {lessonIndex + 1}
                      </p>
                      <h2 className="mt-1 text-[26px] font-semibold capitalize text-[var(--lms-heading)]">
                        {lesson.name.trim()||"Untitled lesson"}
                      </h2>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Created on {lessonCreatedOn(lesson.createdAt)}
                      </p>
                      {lesson.description ? (
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-body">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone="neutral">
                        {itemCount} items
                      </Badge>

                    </div>
                  </div>



                  {itemCount === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
                      No shared learning items in
                      this Lesson yet.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {lesson.contents.map(
                        (item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                          />
                        ),
                      )}
                      {lesson.assignments.map(
                        (item) => (
                          <AssignmentCard
                            key={item.id}
                            item={item}
                          />
                        ),
                      )}
                      {lesson.quizzes.map(
                        (item) => (
                          <QuizCard
                            key={item.id}
                            item={item}
                          />
                        ),
                      )}
                    </div>
                  )}
                  <Disclosure title="Add learning item" className="mt-4" contentClassName="pt-3 pb-2">
                  <FacultyLessonAuthoring
                    lessonId={lesson.id}
                    deliveryId={null}
                    audience="OFFERING"
                    nextContentSequence={
                      lesson.nextContentSequence
                    }
                    nextAssignmentSequence={
                      lesson.nextAssignmentSequence
                    }
                    nextQuizSequence={
                      lesson.nextQuizSequence
                    }
                  />
                  </Disclosure>
                  <Disclosure title="Lesson management" className="mt-2" contentClassName="flex min-w-0 flex-wrap items-start gap-3 pt-3 pb-2">
                      <CollegeLessonReorderActions
                        fullCourseOrder
                        courseName={offering.courseName}
                        learningPathId={learningPath.id}
                        lessonId={lesson.id}
                        expectedSequence={lesson.sequence}
                        canMoveUp={lessonIndex > 0}
                        canMoveDown={lessonIndex < workspace.lessons.length - 1}
                      />
                      <CollegeLessonVisibilityControl lesson={{
                        id:lesson.id,name:lesson.name,visibleToStudents:lesson.visibleToStudents,
                        updatedAt:lesson.updatedAt.toISOString(),
                      }}/>
                      <LessonActions
                        lesson={lesson}
                      />
                  </Disclosure>
                </section>
              );
            },
          ):null}
        </div>
      )}
    </div>
  );
}
