import { StatTile } from "@/components/ui/stat-tile";
import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { FacultyLessonAuthoring } from "./faculty-lesson-authoring";
import {facultyCourseTabHref} from "@/modules/courses/faculty-course-navigation";
import { FacultyLessonVideoManager } from "./faculty-lesson-video-manager";
import { FacultyContentEditor } from "./faculty-content-editor";
import { facultyContentExternalHref, facultyYouTubeEmbed } from "@/modules/courses/faculty-content-preview-model";
import { FacultyAssessmentLifecycle } from "./faculty-assessment-lifecycle";
import { FacultyItemActions } from "./faculty-item-actions";
import { FacultyAssignmentReview } from "./faculty-assignment-review";
import { FacultyQuizReview } from "./faculty-quiz-review";
import {FacultyQuizLearnerPreview} from "./faculty-quiz-learner-preview";
import { FacultyAssessmentEditor } from "./faculty-assessment-editor";
import { FacultyAssignmentResourcesEditor } from "./faculty-assignment-resources-editor";
import {normalizeAssignmentMethods} from "@/modules/courses/assignment-submission-methods";
import { FacultyQuizQuestionEditor } from "./faculty-quiz-question-editor";
import { FacultyCourseHomeSignals } from "./faculty-course-home-signals";
import { FacultyPrototypeCoursePriorities } from "./faculty-prototype-course-priorities";
import {FacultyPrototypeBlueprint} from "./faculty-prototype-blueprint";
import type {FacultyBlueprintContentCreateMode} from "@/modules/courses/faculty-blueprint-add-target";
import { FacultyCourseItemViewer } from "./faculty-course-item-viewer";
import { CourseDisplayReadOnly } from "./course-display-read-only";
import { FacultyContentOrderEditor } from "./faculty-content-order-editor";
import { lessonContentOrderRuntimeEnabled } from "@/modules/courses/lesson-content-order-readiness";
import {resourceMaterialsRuntimeEnabled} from "@/modules/courses/resource-material-readiness";
import {LessonResourceMaterialsControl} from "./lesson-resource-materials-control";
import type { CourseDisplayContentView } from "@/modules/courses/course-display-service";
import type { getFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-service";
import {
  facultyOwnedItemActions,
  nextLessonItemSequence,
} from "./faculty-course-operation-model";
import {
  getFacultyCourseWorkspace,
} from "@/modules/courses/faculty-course-service";


/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

type Workspace = Awaited<
  ReturnType<
    typeof getFacultyCourseWorkspace
  >
>;

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "DRAFT":
      return "warning" as const;
    case "CLOSED":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function audienceLabel(
  deliveryId: string | null,
) {
  return deliveryId
    ? "This class"
    : "All classes";
}

function ContentGlyph({kind}:{kind:string}) {
  const circle=kind==="QUIZ";
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="h-5 w-5 shrink-0 text-primary-text">
    {circle?<><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2.2-2.5 4"/><path d="M12 17h.01"/></>:
     kind==="VIDEO"||kind==="YOUTUBE"?<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></>:
     kind==="LIVE_CLASS"?<><rect x="2.5" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2"/></>:
     kind==="ASSIGNMENT"?<><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h5"/></>:
     <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></>}
  </svg>;
}

function istDueLabel(value:Date|null|undefined){
 if(!value)return "No deadline";
 return "Due "+new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(value);
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return <StatTile label={label} value={value} detail={detail} />;
}

function ContentItem({
  item,materialsEnabled,focused=false,
}: {
  item: Workspace["lessons"][number]["contents"][number];
  materialsEnabled:boolean;
  focused?:boolean;
}) {
  const actions = facultyOwnedItemActions({
    deliveryId: item.deliveryId,
    status: item.status,
    kind: "CONTENT",
  });
  const externalHref=facultyContentExternalHref(item.contentType,item.externalUrl);
  const youtubeEmbed=facultyYouTubeEmbed(item.contentType==="YOUTUBE"?item.externalUrl:null);
  const available = [
    ...(actions.canPublish
      ? (["PUBLISH"] as const)
      : []),
    ...(actions.canArchive
      ? (["ARCHIVE"] as const)
      : []),
  ];

  return (
    <article id={"course-item-"+item.id} aria-label={item.contentType.replaceAll("_"," ")+" "+item.title} className={"min-w-0 scroll-mt-24 border-b border-border bg-transparent py-4 "+(focused?"rounded-[var(--lms-control-radius)] ring-2 ring-[var(--lms-primary)] ring-offset-2":"")}>
      {focused?<StatusBadge tone="info">Selected content</StatusBadge>:null}
      <FacultyCourseItemViewer title={item.title} kind={item.contentType}
        notes={item.notes} externalHref={externalHref} youtubeEmbed={youtubeEmbed}
        startsAt={item.startsAt?.toISOString()??null}
        endsAt={item.endsAt?.toISOString()??null}/>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ContentGlyph kind={item.contentType}/>
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
              {audienceLabel(item.deliveryId)}
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--lms-heading)]">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{item.points} points{item.contentType==="LIVE_CLASS"&&item.startsAt?" · Starts "+new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(item.startsAt):""}{item.contentType==="LIVE_CLASS"&&item.endsAt?" · Ends "+new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(item.endsAt):""}</p>
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
      {youtubeEmbed?<div className="mt-3 aspect-video w-full max-w-2xl overflow-hidden rounded-[var(--lms-control-radius)] border border-border">
        <iframe title={"Preview "+item.title} src={youtubeEmbed}
          className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture" allowFullScreen/>
      </div>:null}
      {externalHref?<div className="mt-3"><ThirdPartyLink href={externalHref}
        label={item.contentType==="LIVE_CLASS"?"Join Meeting":
         item.contentType==="RESOURCE"?"Open":"Watch on YouTube"} /></div>:null}
      {item.contentType==="RESOURCE"&&materialsEnabled?<LessonResourceMaterialsControl
        contentId={item.id} deliveryId={item.deliveryId} editable={Boolean(item.deliveryId)}/>:null}
      {item.deliveryId ? (
        <div aria-label={"Edit or remove "+item.title} className="mt-3 flex flex-wrap items-start gap-2">
          {(
            <FacultyContentEditor
              item={{
                id: item.id,
                contentType: item.contentType,
                title: item.title,
                notes: item.notes,
                externalUrl: item.externalUrl,
                storageKey: item.storageKey,
                durationSeconds: item.durationSeconds,
                points: item.points,
                startsAt: item.startsAt,
                endsAt: item.endsAt,
              }}
            />
          )}
          <FacultyItemActions
            transitionUrl={`/api/courses/lesson-contents/${item.id}/transition`}
            actions={available}
            contentType={item.contentType}
          />
        </div>
      ) : null}
    </article>
  );
}

function AssignmentItem({
  item,
  deliveryId,
  focused=false,
}: {
  item: Workspace["lessons"][number]["assignments"][number];
  deliveryId: string;
  focused?:boolean;
}) {

  return (
    <article id={"course-item-"+item.id} aria-label={"Assignment "+item.title} className={"min-w-0 scroll-mt-24 border-b border-border bg-transparent py-4 "+(focused?"rounded-[var(--lms-control-radius)] ring-2 ring-[var(--lms-primary)] ring-offset-2":"")}>
      {focused?<StatusBadge tone="info">Selected assignment</StatusBadge>:null}
      <FacultyCourseItemViewer title={item.title} kind="ASSIGNMENT" notes={item.description}
        dueAt={item.dueAt?.toISOString()??null}/>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ContentGlyph kind="ASSIGNMENT"/>
            <StatusBadge tone="warning">
              Assignment
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {audienceLabel(item.deliveryId)}
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--lms-heading)]">
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
      <p className="mt-3 text-xs text-muted-foreground">{istDueLabel(item.dueAt)}</p>
      {item.deliveryId ? (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <FacultyAssessmentEditor
            assessment={{
              id: item.id,
              kind: "ASSIGNMENT",
              deliveryId,
              title: item.title,
              description: item.description,
              dueAt: item.dueAt,
              status: item.status,
              updatedAt: item.updatedAt,
              maxPoints: item.maxPoints,
              allowedMethods:normalizeAssignmentMethods(item.allowedSubmissionMethods),
            }}
          />
          <FacultyAssignmentResourcesEditor
            assignment={{
              id:item.id,title:item.title,description:item.description,
              dueAt:item.dueAt,maxPoints:item.maxPoints,
              updatedAt:item.updatedAt,status:item.status,
            }}
            deliveryId={deliveryId}
          />
          <FacultyAssessmentLifecycle
            key={item.id+":"+new Date(item.updatedAt).toISOString()}
            kind="ASSIGNMENT" id={item.id} deliveryId={deliveryId}
            status={item.status} updatedAt={item.updatedAt} owned={true}
          />
        </div>
      ) : null}

      <Link
        href={`/teacher/report/assignment/${item.id}?deliveryId=${encodeURIComponent(deliveryId)}`}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
      >
        Assignment Report
      </Link>
      <FacultyAssignmentReview
        filesEnabled={assignmentFilesRuntimeEnabled()}
        assignmentId={item.id}
        deliveryId={deliveryId}
        maxPoints={item.maxPoints}
        status={item.status}
      />
    </article>
  );
}

function QuizItem({
  item,
  deliveryId,
  focused=false,
}: {
  item: Workspace["lessons"][number]["quizzes"][number];
  deliveryId: string;
  focused?:boolean;
}) {

  return (
    <article id={"course-item-"+item.id} aria-label={"Quiz "+item.title+(item.status==="DRAFT"?", draft, hidden from students":"")} className={"min-w-0 scroll-mt-24 border-b border-border bg-transparent py-4 "+(focused?"rounded-[var(--lms-control-radius)] ring-2 ring-[var(--lms-primary)] ring-offset-2":"")}>
      {focused?<StatusBadge tone="info">Selected quiz</StatusBadge>:null}
      <FacultyCourseItemViewer title={item.title} kind="QUIZ" notes={item.description}
        dueAt={item.dueAt?.toISOString()??null}/>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ContentGlyph kind="QUIZ"/>
            <StatusBadge tone="info">
              Quiz
            </StatusBadge>
            <StatusBadge
              tone={statusTone(item.status)}
            >
              {item.status}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {audienceLabel(item.deliveryId)}
            </StatusBadge>
            {item.status==="DRAFT"?<StatusBadge tone="warning">Draft · hidden from students</StatusBadge>:null}
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--lms-heading)]">
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
        <span>{istDueLabel(item.dueAt)}</span>
        <span>
          {item.maxAttempts} attempt
          {item.maxAttempts === 1 ? "" : "s"}
        </span>
        <span>
          {item.resultsPublished
            ? "Results published"
            : "Results hidden"}
        </span>
      </div>
      {item.deliveryId ? (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <FacultyAssessmentEditor
            assessment={{
              id: item.id,
              kind: "QUIZ",
              title: item.title,
              description: item.description,
              dueAt: item.dueAt,
              status: item.status,
              updatedAt: item.updatedAt,
              maxAttempts: item.maxAttempts,
            }}
          />
          {item.status === "DRAFT" ? (
            <FacultyQuizQuestionEditor
              quizId={item.id}
              deliveryId={deliveryId}
            />
          ) : null}
          <FacultyAssessmentLifecycle
            key={item.id+":"+new Date(item.updatedAt).toISOString()}
            kind="QUIZ" id={item.id} deliveryId={deliveryId}
            status={item.status} updatedAt={item.updatedAt} owned={true}
          />
        </div>
      ) : null}

      <Link
        href={`/teacher/report/quiz/${item.id}?deliveryId=${encodeURIComponent(deliveryId)}`}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
      >
        Quiz Report
      </Link>
      <FacultyQuizLearnerPreview quizId={item.id} deliveryId={deliveryId}/>
      <FacultyQuizReview
        quizId={item.id}
        deliveryId={deliveryId}
        status={item.status}
        resultsPublished={item.resultsPublished}
        deadlineReached={Boolean(item.dueAt && new Date(item.dueAt).getTime()<=currentTimeMs())}
        updatedAt={new Date(item.updatedAt).toISOString()}
        deliveryOwned={item.deliveryId !== null}
      />
    </article>
  );
}

export function FacultyCourseWorkspace({
  workspace,
  homeSignals,
  display,
  view = "ALL",
  contentFilter="ALL",
  selectedLessonId=null,
  selectedContentId=null,
  advanced=false,
  initialCreateMode=null,
}: {
  workspace: Workspace;
  homeSignals: Awaited<
    ReturnType<typeof getFacultyCourseHomeSignals>
  > | null;
  display: CourseDisplayContentView | null;
  view?: "ALL" | "OVERVIEW" | "BLUEPRINT";
  contentFilter?:"ALL"|"LECTURES"|"RESOURCES"|"ASSESSMENTS"|"LIVE";
  selectedLessonId?:string|null;
  selectedContentId?:string|null;
  advanced?:boolean;
  initialCreateMode?:FacultyBlueprintContentCreateMode|null;
}) {
  const { course, learningPath, summary } =
    workspace;

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <div aria-label="Course context" className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <p className="m-0 text-sm text-muted-foreground">
          {course.courseCode} · {course.sectionName} · {course.academicPeriodName}
        </p>
        {view!=="BLUEPRINT"?(      <nav aria-label="Overview actions" className="flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:flex-wrap">
        <Link
          href={"/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/reports"}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-body-text)] min-[768px]:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
        >
          Section reports hub
        </Link>
        <Link
          href={"/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/students"}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
        >
          Current Section students
        </Link>
      </nav>):null}
      </div>

      {view !== "BLUEPRINT" ? (
        <>
      <FacultyPrototypeCoursePriorities signals={homeSignals} workspace={workspace} display={display} />
      <details id="course-details" open={advanced} className="min-w-0 border-t border-[#e5ebf2] pt-3"><summary className="cursor-pointer text-sm font-semibold text-[#078191]">More course insights and teaching tools</summary><div className="mt-5 space-y-6">

      <CourseDisplayReadOnly
        introductionText={
          display?.introductionText ?? null
        }
        bodyHtml={display?.bodyHtml ?? null}
        takeaways={display?.takeaways ?? []}
        fallbackDescription={
          course.courseDescription
        }
      />


      {homeSignals?<FacultyCourseHomeSignals
        signals={homeSignals}
        deliveryId={course.deliveryId}
      />:<div role="alert" className="border-b border-border pb-4 text-sm text-body">
        Some course state could not be loaded. The Blueprint is still available.
        <Link href={facultyCourseTabHref(course.deliveryId,"home")+"?refreshSignals=1"}
          className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry signals</Link>
      </div>}

      <section aria-label="In this Course" className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
        <Badge tone="neutral">
          {course.credits===null?"Credits not configured":course.credits+" Credits"}
        </Badge>
        <span className="text-sm text-body">
          Instructor: You · {course.teachingRole.replaceAll("_"," ").toLowerCase()}
        </span>
      </section>

      <section className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              Your teaching class
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--lms-heading)]">
              {course.sectionName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-body">
              You teach this class as {course.teachingRole.replaceAll("_"," ").toLowerCase()}.
            </p>
          </div>
          <StatusBadge tone="info">
            {course.teachingRole.replaceAll(
              "_",
              " ",
            )}
          </StatusBadge>
        </div>
        <div className="mt-4 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-50)] px-3 py-2 text-xs leading-5 text-muted-foreground">
          Your class includes course-wide learning materials and content
          added specifically for these students.
        </div>
      </section>

      <div className="grid min-w-0 gap-3 min-[768px]:grid-cols-2 xl:grid-cols-5">
        <Link href={facultyCourseTabHref(course.deliveryId,"blueprint")}
          className="rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-primary">
          <Metric label="Lessons" value={summary.lessons}
            detail="Open your Blueprint lessons →"/>
        </Link>
        <Link href={facultyCourseTabHref(course.deliveryId,"blueprint")+"?filter=LECTURES"}
          className="rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-primary">
          <Metric label="Content" value={summary.contents}
            detail="Browse lectures and section materials →"/>
        </Link>
        <Link href={facultyCourseTabHref(course.deliveryId,"blueprint")+"?filter=ASSESSMENTS"}
          className="rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-primary">
          <Metric label="Assignments" value={summary.assignments}
            detail="Browse lesson assignments →"/>
        </Link>
        <Link href={"/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/quizzes"}
          className="rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-primary">
          <Metric label="Quizzes" value={summary.quizzes}
            detail="Review quizzes and learner results →"/>
        </Link>
        <Metric
          label="Draft items"
          value={summary.draftItems}
          detail={`${summary.publishedItems} published items are learner-visible when the path is published.`}
        />
      </div>

      </div></details>
        </>
      ) : null}

      {view !== "OVERVIEW" ? (
        <>
        <FacultyPrototypeBlueprint workspace={workspace} selectedLessonId={selectedLessonId}
         engagement={homeSignals?.lessonEngagement??null}/>
        <details className="border-t border-[#e5ebf2] pt-4" open={advanced||Boolean(initialCreateMode)}>
         <summary className="cursor-pointer text-sm font-semibold text-[#078191]">Full blueprint editor, publishing and content ordering</summary>
         <div className="mt-5 space-y-5">
      {!learningPath ? (
        <EmptyState
          title="No current learning path"
          description="The Course Offering does not have an active learning path yet. Learning-path structure remains a College Admin / scoped Super Admin responsibility."
        />
      ) : (
        <>
          <section id="learning-path" className="scroll-mt-24 border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  Course Blueprint
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--lms-heading)]">
                  {learningPath.title}
                </h2>
                {learningPath.description ? (
                  <p className="mt-2 text-sm leading-6 text-body">
                    {learningPath.description}
                  </p>
                ) : null}
              </div>
              <StatusBadge
                tone={statusTone(
                  learningPath.status,
                )}
              >
                {learningPath.status}
              </StatusBadge>
            </div>
          </section>

          <Tabs
            ariaLabel="Course Blueprint content filters"
            value={contentFilter}
            renderPanel={false}
            items={([
              ["ALL","All"],["LECTURES","Lectures"],["RESOURCES","Resources"],
              ["ASSESSMENTS","Assessments"],["LIVE","Live sessions"],
            ] as const).map(([value,label]) => ({
              value,
              label,
              href: facultyCourseTabHref(course.deliveryId,"blueprint")+
                "?"+new URLSearchParams({
                  ...(value==="ALL"?{}:{filter:value==="LIVE"?"live-sessions":value.toLowerCase()}),
                  ...(selectedLessonId?{lesson:selectedLessonId}:{}),
                  ...(selectedContentId?{content:selectedContentId}:{}),
                }).toString(),
            }))}
          />
          {selectedLessonId?<nav aria-label="Lesson navigation" className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
            <Link href={facultyCourseTabHref(course.deliveryId,"blueprint")} className="font-semibold text-primary-text underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">
              Back to Blueprint
            </Link>
            {workspace.lessons.map((lesson,index)=>lesson.id===selectedLessonId?(
              <div key={lesson.id} className="flex flex-wrap items-center gap-3 text-sm">
                {index>0?<Link className="text-primary-text underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center" href={"?lesson="+encodeURIComponent(workspace.lessons[index-1]?.id ?? "")}>
                  Previous lesson
                </Link>:null}
                <span className="text-muted-foreground">Lesson {index+1} of {workspace.lessons.length}</span>
                {index+1<workspace.lessons.length?<Link className="text-primary-text underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center" href={"?lesson="+encodeURIComponent(workspace.lessons[index+1]?.id ?? "")}>
                  Next lesson
                </Link>:null}
              </div>
            ):null)}
          </nav>:null}
          {workspace.lessons.length === 0 ? (
            <EmptyState
              title="No lessons yet"
              description="Lessons are managed by the admin team. Once lessons are available, faculty can add lectures, resources, assessments, and live classes here."
            />
          ) : (
            <div className="space-y-6">
              {workspace.lessons.filter(lesson=>!selectedLessonId||lesson.id===selectedLessonId).map(
                (lesson) => {
                  const lessonIndex=workspace.lessons.findIndex(row=>row.id===lesson.id);
                  const visibleContents=lesson.contents.filter(item=>
                    contentFilter==="ALL"||item.id===selectedContentId||
                    contentFilter==="LECTURES"&&["VIDEO","YOUTUBE"].includes(item.contentType)||
                    contentFilter==="RESOURCES"&&item.contentType==="RESOURCE"||
                    contentFilter==="LIVE"&&item.contentType==="LIVE_CLASS");
                  const visibleAssignments=contentFilter==="ALL"||contentFilter==="ASSESSMENTS"?
                    lesson.assignments:lesson.assignments.filter(item=>item.id===selectedContentId);
                  const visibleQuizzes=contentFilter==="ALL"||contentFilter==="ASSESSMENTS"?
                    lesson.quizzes:lesson.quizzes.filter(item=>item.id===selectedContentId);
                  const itemCount =
                    visibleContents.length+visibleAssignments.length+visibleQuizzes.length;
                  const nextSequence =
                    nextLessonItemSequence([
                      ...lesson.contents.map(
                        (item) => item.sequence,
                      ),
                      ...lesson.assignments.map(
                        (item) => item.sequence,
                      ),
                      ...lesson.quizzes.map(
                        (item) => item.sequence,
                      ),
                    ]);

                  return (
                    <Disclosure key={lesson.id}
                      defaultOpen={Boolean(selectedLessonId || lessonIndex === 0)}
                      
                      
                      title={<div className="flex w-full min-w-0 flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">

                        <div>
                          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                            Lesson{" "}
                            {lessonIndex + 1}
                          </p>
                          <h2 className="mt-1 break-words text-lg font-semibold text-[var(--lms-heading)]">
                            {lesson.name}
                          </h2>
                          {lesson.description ? (
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-body">
                              {
                                lesson.description
                              }
                            </p>
                          ) : null}
                        </div>
                        <Badge tone="neutral">
                          {itemCount} items · Expand lesson
                        </Badge>
                      
                      </div>}
                      className="group min-w-0 border-b border-border bg-transparent py-3">

                      {!selectedLessonId?<Link href={"?lesson="+encodeURIComponent(lesson.id)}
                        className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
                        View lesson details →
                      </Link>:<div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <Badge tone="neutral">
                          {lesson.contents.length} content
                        </Badge>
                        <Badge tone="neutral">
                          {lesson.assignments.length} assignments
                        </Badge>
                        <Badge tone="neutral">
                          {lesson.quizzes.length} quizzes
                        </Badge>
                      </div>}
                      <details id={"faculty-lesson-add-"+lesson.id}
                        open={Boolean(initialCreateMode&&selectedLessonId===lesson.id)}
                        className="mb-3 rounded-[var(--lms-control-radius)] border border-border bg-surface">
                        <summary className="min-h-11 cursor-pointer select-none px-3 py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)]">
                          + Add content
                        </summary>
                        <div className="border-t border-border p-3">
                          <p className="mb-3 text-xs text-muted-foreground" aria-label="Add content types">
                            Video · Resources · Quiz · Assignment · Live Session
                          </p>
                      <FacultyLessonAuthoring
                        key={lesson.id+":"+(selectedLessonId===lesson.id?initialCreateMode??"default":"default")}
                        initialMode={selectedLessonId===lesson.id&&initialCreateMode!=="VIDEO"?initialCreateMode:null}
                        lessonId={lesson.id}
                        deliveryId={course.deliveryId}
                        enableAssignmentResources
                        nextContentSequence={
                          nextSequence
                        }
                        nextAssignmentSequence={
                          nextSequence
                        }
                        nextQuizSequence={
                          nextSequence
                        }
                      />

                      <FacultyLessonVideoManager
                        key={lesson.id+":"+(selectedLessonId===lesson.id&&initialCreateMode==="VIDEO"?"upload":"default")}
                        openUploadOnMount={selectedLessonId===lesson.id&&initialCreateMode==="VIDEO"}
                        lessonId={lesson.id}
                        deliveryId={course.deliveryId}
                        nextContentSequence={nextSequence}
                      />


                        </div>
                      </details>

                      <FacultyContentOrderEditor
                        lessonId={lesson.id}
                        deliveryId={course.deliveryId}
                        enabled={lessonContentOrderRuntimeEnabled()}
                        items={lesson.contents.map(
                          (item) => ({
                            id: item.id,
                            title: item.title,
                          }),
                        )}
                      />

                      {itemCount === 0 ? (
                        <div className="mt-3 rounded-[var(--lms-canvas-radius)] border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
                          {selectedLessonId&&contentFilter==="ALL"?"No lesson content yet":contentFilter==="ALL"?"No active content or assessments in this lesson.":"No lesson content matches this filter."}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {visibleContents.map(
                            (item) => (
                              <ContentItem
                                key={item.id}
                                item={item}
                                materialsEnabled={resourceMaterialsRuntimeEnabled()}
                                focused={selectedContentId===item.id}
                              />
                            ),
                          )}
                          {visibleAssignments.map(
                            (item) => (
                              <AssignmentItem
                                key={item.id}
                                item={item}
                                deliveryId={course.deliveryId}
                                focused={selectedContentId===item.id}
                              />
                            ),
                          )}
                          {visibleQuizzes.map(
                            (item) => (
                              <QuizItem
                                key={item.id}
                                item={item}
                                deliveryId={course.deliveryId}
                                focused={selectedContentId===item.id}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </Disclosure>
                  );
                },
              )}
            </div>
          )}
        </>
      )}
        </div>
        </details>
        </>
      ) : null}
    </div>
  );
}
