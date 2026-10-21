"use client";
import { Badge } from "@/components/ui/badge";
import {DataTable} from "@/components/ui/data-table";
import { Disclosure } from "@/components/ui/disclosure";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { filterFacultyAssessments } from "@/modules/courses/faculty-assessment-filter";
import { StatusBadge } from "@/components/ui/status-badge";
import { FacultyAssignmentReview } from "./faculty-assignment-review";
import { FacultyQuizReview } from "./faculty-quiz-review";
import { FacultyAssessmentEditor } from "./faculty-assessment-editor";
import {normalizeAssignmentMethods} from "@/modules/courses/assignment-submission-methods";
import { FacultyQuizQuestionEditor } from "./faculty-quiz-question-editor";
import { FacultyAssessmentCreate } from "./faculty-assessment-create";
import type { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
import { facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";
import { FacultyAssessmentLifecycle } from "./faculty-assessment-lifecycle";

type Overview = Awaited<ReturnType<typeof getFacultyAssessmentOverview>>;
type Assessment = Overview["assignments"][number] | Overview["quizzes"][number];
const PAGE_SIZE = 20;
function assessmentStatus(item:Assessment){
 if(item.status==="DRAFT")return item.kind==="QUIZ"&&!item.dueAt?"Needs due date":"Draft";
 if(item.status==="CLOSED")return "Closed";
 if(item.status==="ARCHIVED")return "Archived";
 if(item.status==="PUBLISHED"&&item.dueAt&&new Date(item.dueAt).getTime()<Date.now())return "Closed";
 return item.status==="PUBLISHED"?"Open":item.status;
}

export function FacultyAssessmentOverview({
  overview,
  kind,
  filesEnabled,
  initialQuizId=null,
}: {
  filesEnabled: boolean;
  initialQuizId?:string|null;
  overview: Overview;
  kind: "ASSIGNMENT" | "QUIZ";
}) {
  const [courseCode, setCourseCode] = useState("");
  const [viewedKey,setViewedKey] = useState<string|null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(()=>{
    if(kind!=="QUIZ"||!initialQuizId)return 1;
    const index=overview.quizzes.findIndex(item=>item.id===initialQuizId);
    return index<0?1:Math.floor(index/PAGE_SIZE)+1;
  });
  const items: Assessment[] =
    kind === "ASSIGNMENT" ? overview.assignments : overview.quizzes;

  const courseChoices = useMemo(() =>
    [...new Map(overview.courses.map(course => [course.courseCode, {
      code: course.courseCode, name: course.courseName,
    }])).values()].sort((a,b)=>a.name.localeCompare(b.name)||a.code.localeCompare(b.code)),
    [overview.courses],
  );
  const filtered = useMemo(
    () => filterFacultyAssessments(
      courseCode ? items.filter(item=>item.courseCode===courseCode) : items,
      { status, search },
    ),
    [items, courseCode, status, search],
  );
  const viewedItem=items.find(item=>`${item.deliveryId}:${item.id}`===viewedKey);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const value = new Date(date);
    return Number.isNaN(value.getTime())
      ? "Date unavailable"
      : new Intl.DateTimeFormat("en-IN", {
          timeZone:"Asia/Kolkata",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,
        }).format(value);
  };

  if (items.length === 0) {
    return (
      <div className="min-w-0 space-y-6">
        <FacultyAssessmentCreate kind={kind} lessons={overview.lessonChoices} />
        <EmptyState
          title={kind === "QUIZ" ? "No quizzes yet" : "No assignments yet"}
          description={kind==="QUIZ"?"Create your first quiz to get started.":"Create your first assignment to get started."}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div aria-label={kind === "QUIZ" ? "Quiz totals" : "Assignment totals"} className="flex flex-wrap items-center gap-2">
        <Badge  tone="neutral">
          {items.length} {kind === "QUIZ" ? (items.length === 1 ? "Quiz" : "Quizzes") : (items.length === 1 ? "Assignment" : "Assignments")}
        </Badge>
        <Badge  tone="neutral">
          {new Set(items.map(item => item.courseCode)).size} {new Set(items.map(item => item.courseCode)).size === 1 ? "Course" : "Courses"}
        </Badge>
      </div>

      <FacultyAssessmentCreate kind={kind} lessons={overview.lessonChoices} />
      <Disclosure title={kind==="QUIZ"?"Quizzes by Course":"Assignments by Course"} className="border-b border-border pb-3">
        <ul className="mt-3 grid gap-2 text-sm text-body md:grid-cols-2">
          {Array.from(new Set(items.map(item=>item.courseCode))).sort().map(code=>
            <li key={code} className="flex min-w-0 justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0">
              <span>{items.find(item=>item.courseCode===code)?.courseName??code}</span>
              <strong>{items.filter(item=>item.courseCode===code).length}</strong>
            </li>)}
        </ul>
      </Disclosure>
      <div className="grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Course
          <Select
            value={courseCode}
            onChange={(event) => {
              setCourseCode(event.target.value);
              setPage(1);
            }}
            className="mt-1.5"
          >
            <option value="">All courses</option>
            {courseChoices.map((course) => (
              <option key={course.code} value={course.code}>
                {course.code} · {course.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Status
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="mt-1.5"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            {kind === "QUIZ" ? <option value="CLOSED">Closed</option> : null}
            <option value="ARCHIVED">Archived</option>
          </Select>
        </label>
        <label className="min-w-0 text-[13px] font-semibold leading-4 sm:col-span-2 lg:col-span-1 text-[var(--lms-neutral-400)]">
          Search assessments
          <Input
            className="mt-[6px]"
            aria-label="Search assessments"
            placeholder="Title, lesson, Course or Section"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      <p aria-live="polite" className="text-xs text-muted-foreground leading-[20px]">
        Showing {filtered.length} of {items.length} {kind === "QUIZ" ? "quizzes" : "assignments"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={kind==="QUIZ"?"No matching quizzes":"No matching assignments"}
          description="Change Course or Status to see other assessments."
        />
      ) : (
        <div className="min-w-0 divide-y divide-border md:hidden" aria-label={kind === "QUIZ" ? "All quizzes" : "All assignments"}>
          {rows.map((item) => (
            <article
              key={`${item.deliveryId}:${item.id}`}
              className="min-w-0 py-4 first:pt-2 last:pb-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--lms-primary-text)]"
            >
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.status === "PUBLISHED" ? "success" : item.status === "DRAFT" ? "warning" : "neutral"}>
                      {assessmentStatus(item)}
                    </StatusBadge>
                    <StatusBadge tone="info">
                      {item.authoredDeliveryId ? "This Section" : "Shared Offering"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-2 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
                    <Button type="button" variant="link" size="sm"
                      className="h-auto min-h-11 max-w-full justify-start whitespace-normal break-words p-0 text-left font-semibold text-inherit underline-offset-2 hover:underline md:min-h-9"
                      aria-label={`View ${item.kind === "QUIZ" ? "quiz" : "assignment"} ${item.title||"Untitled"}`}
                      onClick={()=>setViewedKey(`${item.deliveryId}:${item.id}`)}>
                      {item.title.trim()||"Untitled"}
                    </Button>
                  </h2>
                  <p className="mt-1 break-words text-sm text-body leading-[22px]">
                    {item.courseName} · {item.sectionName} · {item.lessonName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                    {item.academicPeriodName} · {item.dueAt?`Due ${formatDate(item.dueAt)}`:`Created: ${formatDate(item.createdAt)}`}
                  </p>
                  {item.status==="DRAFT"?<p className="mt-1 text-xs font-semibold text-warning leading-[20px]">
                    Draft · hidden from students
                  </p>:null}
                  {item.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-body leading-[22px]">{item.description}</p>
                  ) : null}
                </div>
                <div className="w-full min-w-0 lg:w-auto lg:max-w-[27rem]">
                  <Button type="button" variant="secondary" size="sm"
                    className="min-h-11 w-full md:min-h-9"
                    onClick={()=>setViewedKey(`${item.deliveryId}:${item.id}`)}>
                    View details
                  </Button>
                  <Disclosure title="Actions" className="border-0" summaryClassName="min-h-11 md:min-h-9" contentClassName="grid min-w-0 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-1">
                  {item.facultyOwned ? (
                    <>
                      {item.kind==="QUIZ" && item.status!=="DRAFT" ? (
                        <Alert tone="info">
                          Published Quiz questions and attempt limits are locked. The editor permits only server-approved metadata changes; deadlines are rejected after learner attempts.
                        </Alert>
                      ) : null}
                      <FacultyAssessmentEditor
                        assessment={{
                          id: item.id,
                          kind: item.kind,
                          title: item.title,
                          description: item.description,
                          dueAt: item.dueAt,
                          status: item.status,
                          updatedAt: item.updatedAt,
                          ...(item.kind === "QUIZ"
                            ? { maxAttempts: item.maxAttempts }
                            : { maxPoints: item.maxPoints, hasSubmissions:item.hasSubmissions,
                              allowedMethods:normalizeAssignmentMethods(item.allowedSubmissionMethods),
                              deliveryId:item.deliveryId }),
                        }}
                      />
                      {item.kind === "QUIZ" &&
                      item.status === "DRAFT" ? (
                        <FacultyQuizQuestionEditor
                          quizId={item.id}
                          deliveryId={item.deliveryId}
                        />
                      ) : null}
                      <Link
                        href={"/teacher/courses/" + encodeURIComponent(item.deliveryId) +
                          (item.kind === "QUIZ" ? "/quizzes/manage" : "/assignments/manage")}
                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:underline"
                      >
                        Manage {item.kind === "QUIZ" ? "quiz" : "assignment"}
                      </Link>
                      <FacultyAssessmentLifecycle
                        key={item.id + ":" + new Date(item.updatedAt).toISOString()}
                        kind={item.kind}
                        id={item.id}
                        deliveryId={item.deliveryId}
                        updatedAt={item.updatedAt}
                        status={item.status}
                        owned={item.facultyOwned}
                      />
                    </>
                  ) : null}
                  <Link
                    href={`/teacher/report/${item.kind === "QUIZ" ? "quiz" : "assignment"}/${item.id}?deliveryId=${encodeURIComponent(item.deliveryId)}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:underline"
                  >
                    View Report
                  </Link>
                  {item.kind==="ASSIGNMENT"?<Link
                    href={`/teacher/report/assignment/${item.id}?deliveryId=${encodeURIComponent(item.deliveryId)}#submissions`}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:underline">
                    View submissions
                  </Link>:null}
                  <Link
                    href={facultyCourseTabHref(item.deliveryId, "blueprint")}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] text-[14px] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:underline"
                  >
                    Open Course
                  </Link>
                  </Disclosure>
                </div>
              </div>
              {item.kind === "QUIZ" ? (
                <>
                  <p className="mt-3 text-xs text-muted-foreground leading-[20px]">
                    {item.maxAttempts} allowed attempts · {item.totalPoints} points ·
                    {" "}{item.resultsPublished ? "Results published" : "Results private"}
                  </p>
                  <FacultyQuizReview
                    quizTitle={item.title}
                    quizId={item.id}
                    autoOpen={kind==="QUIZ"&&initialQuizId===item.id}
                    deliveryId={item.deliveryId}
                    status={item.status}
                    resultsPublished={item.resultsPublished}
                    updatedAt={new Date(item.updatedAt).toISOString()}
                    deliveryOwned={item.facultyOwned}
                  />
                </>
              ) : (
                <>
                  <p className="mt-3 text-xs text-muted-foreground leading-[20px]">
                    {item.maxPoints} points · Grade visible to learner only after publication
                  </p>
                  <FacultyAssignmentReview
                    filesEnabled={filesEnabled}
                    assignmentId={item.id}
                    deliveryId={item.deliveryId}
                    maxPoints={item.maxPoints}
                    status={item.status}
                  />
                </>
              )}
            </article>
          ))}
        </div>
        <div className="hidden min-w-0 md:block">
          <DataTable
            caption={kind==="QUIZ"?"My Quizzes":"My Assignments"}
            mobileMode="scroll"
            rows={rows}
            getRowKey={item=>item.deliveryId+":"+item.id}
            empty={<EmptyState title={kind==="QUIZ"?"No quizzes yet":"No assignments yet"}/>}
            columns={[
              {key:"overview",header:"Overview",mobilePriority:"primary" as const,
                className:"w-[18%] max-w-[210px]",
                cell:(item)=><button type="button"
                  className="min-h-9 w-full truncate text-left font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={"View "+(item.kind==="QUIZ"?"quiz ":"assignment ")+(item.title.trim()||"Untitled")}
                  onClick={()=>setViewedKey(item.deliveryId+":"+item.id)}>
                  {item.title.trim()||"Untitled"}
                </button>},
              {key:"course",header:"Course",mobilePriority:"secondary" as const,
                className:"w-[11%] max-w-[140px]",
                cell:(item)=><span className="block truncate" title={item.courseName}>{item.courseName}</span>},
              {key:"lesson",header:"Lesson",mobilePriority:"secondary" as const,
                className:"w-[10%] max-w-[130px]",
                cell:(item)=><span className="block truncate" title={item.lessonName}>{item.lessonName}</span>},
              {key:"due",header:"Due Date",mobilePriority:"secondary" as const,
                className:"w-[12%] whitespace-nowrap",
                cell:(item)=>formatDate(item.dueAt)},
              {key:"status",header:"Status",mobilePriority:"secondary" as const,
                className:"w-[8%]",
                cell:(item)=><StatusBadge tone={assessmentStatus(item)==="Open"?"success":
                  assessmentStatus(item)==="Needs due date"?"warning":"neutral"}>
                  {assessmentStatus(item)}</StatusBadge>},
              {key:"results",header:"Results",mobilePriority:"secondary" as const,
                className:"w-[13%]",
                cell:(item)=>item.kind==="QUIZ"?
                  <StatusBadge tone={item.resultsPublished?"success":"neutral"}>
                    {item.resultsPublished?"Released":"Withheld"}</StatusBadge>:
                  <span className="text-xs text-muted-foreground">{item.hasSubmissions?"Submissions recorded":"Not submitted"}</span>},
              {key:"submissions",header:"Submissions",mobilePriority:"secondary" as const,
                className:"w-[11%]",
                cell:(item)=>item.kind==="QUIZ"?"View report":item.hasSubmissions?"Received":"None"},
              {key:"actions",header:"Actions",mobilePriority:"action" as const,
                className:"md:sticky md:right-0 md:z-20 md:bg-surface min-w-[230px] w-[17%]",
                cell:(item)=><div className="flex min-w-[210px] flex-wrap items-center gap-2">
                  <Button type="button" variant="secondary" size="sm"
                    aria-label={"Preview "+(item.kind==="QUIZ"?"quiz ":"assignment ")+(item.title||"Untitled")}
                    onClick={()=>setViewedKey(item.deliveryId+":"+item.id)}>
                    Preview
                  </Button>
                  <Link href={"/teacher/report/"+(item.kind==="QUIZ"?"quiz":"assignment")+"/"+item.id+"?deliveryId="+encodeURIComponent(item.deliveryId)}
                    className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">
                    View report
                  </Link>
                  {item.facultyOwned?<FacultyAssessmentEditor assessment={{
                    id:item.id,kind:item.kind,title:item.title,description:item.description,
                    dueAt:item.dueAt,status:item.status,updatedAt:item.updatedAt,
                    ...(item.kind==="QUIZ"?{maxAttempts:item.maxAttempts}:{
                      maxPoints:item.maxPoints,hasSubmissions:item.hasSubmissions,
                      allowedMethods:normalizeAssignmentMethods(item.allowedSubmissionMethods),
                      deliveryId:item.deliveryId,
                    }),
                  }}/> : null}
                  {item.facultyOwned?<FacultyAssessmentLifecycle
                    kind={item.kind} id={item.id} deliveryId={item.deliveryId}
                    updatedAt={item.updatedAt} status={item.status}
                    owned={item.facultyOwned}/>:null}
                  {item.kind==="QUIZ"?<FacultyQuizReview
                    quizTitle={item.title} quizId={item.id}
                    autoOpen={kind==="QUIZ"&&initialQuizId===item.id}
                    deliveryId={item.deliveryId} status={item.status}
                    resultsPublished={item.resultsPublished}
                    updatedAt={new Date(item.updatedAt).toISOString()}
                    deliveryOwned={item.facultyOwned}/>:
                    <FacultyAssignmentReview
                      filesEnabled={filesEnabled} assignmentId={item.id}
                      deliveryId={item.deliveryId} maxPoints={item.maxPoints}
                      status={item.status}/>}
                </div>},
            ]}
          />
        </div>
      )}

      <Drawer open={Boolean(viewedItem)} onOpenChange={open=>{if(!open)setViewedKey(null);}}
        title={viewedItem?.title??"Assessment details"}
        description={viewedItem ? `${viewedItem.courseName} · ${viewedItem.sectionName}` : undefined}>
        {viewedItem ? <div className="min-w-0 space-y-4 text-sm text-body">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={viewedItem.status==="PUBLISHED"?"success":"neutral"}>{viewedItem.status}</StatusBadge>
            <StatusBadge tone="info">{viewedItem.authoredDeliveryId?"This Section":"Shared Offering"}</StatusBadge>
          </div>
          <dl className="grid min-w-0 grid-cols-2 gap-3">
            <div><dt className="text-xs text-muted-foreground">Course</dt>
              <dd className="break-words font-semibold text-foreground">{viewedItem.courseName} ({viewedItem.courseCode})</dd></div>
            <div><dt className="text-xs text-muted-foreground">Lesson</dt>
              <dd className="break-words font-semibold text-foreground">{viewedItem.lessonName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Due</dt>
              <dd className="font-semibold text-foreground">{formatDate(viewedItem.dueAt)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Maximum</dt>
              <dd className="font-semibold text-foreground">
                {viewedItem.kind==="QUIZ"?`${viewedItem.totalPoints} points · ${viewedItem.maxAttempts} attempts`:`${viewedItem.maxPoints} points`}
              </dd></div>
          </dl>
          <section className="border-t border-border pt-3">
            <h3 className="mb-2 font-semibold text-foreground">Instructions</h3>
            <p className="whitespace-pre-wrap break-words leading-6">
              {viewedItem.description||"No additional instructions provided."}
            </p>
          </section>
          <Link href={facultyCourseTabHref(viewedItem.deliveryId,"blueprint")}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
            Open Course
          </Link>
        </div> : null}
      </Drawer>

      {totalPages > 1 ? (
        <nav aria-label="Assessment pages" className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)]">
          <Button variant="secondary"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 text-body hover:bg-primary-subtle md:min-h-9" >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="secondary"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="min-h-11 text-body hover:bg-primary-subtle md:min-h-9" >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
