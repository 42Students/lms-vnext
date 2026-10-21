"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,type FormEvent} from "react";
import Link from "next/link";

export type ProjectParticipantListQuery = {
  search?: string;
  status?:
    | "CURRENT"
    | "PLANNED"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED" | "IN_PROGRESS" | "READY" | "BLOCKED";
  assignment?: "PRIMARY" | "SUPPORTING";
  attention?:
    | "MENTOR_REVIEW"
    | "MENTOR_REQUESTED"
    | "MENTOR_STALLED"
    | "MENTOR_MEETING_SOON"
    | "MENTOR_ANY_ATTENTION"
    | "MENTOR_NO_ATTENTION"
    | "LEARNER_ACTION" | "BLOCKED";
  work?: "BLOCKED" | "NO_TASKS" | "HAS_OPEN_TASKS" | "ALL_DONE" | "HAS_DONE_TASKS";
  sort?: "RECENT" | "TITLE" | "PROGRESS" | "PROGRESS_DESC" | "OPEN_TASKS" | "TEAM_SIZE_DESC" | "TEAM_SIZE_ASC";
  page?: number;
  pageSize?: number;
};

const statusOptions = [
  ["CURRENT", "Current only"],
  ["PLANNED", "Planned"],
  ["ACTIVE", "Active"],
  ["COMPLETED", "Completed"],
  ["ARCHIVED", "Archived"],
] as const;
const mentorStatusOptions = [
 ["CURRENT","Current only"],["ACTIVE","Active"],["IN_PROGRESS","In progress"],
 ["READY","Ready"],["BLOCKED","Blocked"],["ARCHIVED","Archived"],
] as const;

export function ProjectParticipantListControls({
  basePath,
  query,
  mentor,
  learner,
}: {
  basePath: string;
  query: ProjectParticipantListQuery;
  mentor?: boolean;
  learner?: boolean;
}) {
  const liveForm = useRef<HTMLFormElement | null>(null);
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(()=>()=>{if(liveTimer.current)clearTimeout(liveTimer.current);},[]);
  function liveRefresh(event:FormEvent<HTMLFormElement>){
    if(!mentor)return;
    if(liveTimer.current)clearTimeout(liveTimer.current);
    // Select/clear operations in the original footer applied immediately.
    // Only typed search text should debounce; Enter can still submit now.
    if(event.target instanceof HTMLSelectElement){
      liveForm.current?.requestSubmit();
    }else{
      liveTimer.current=setTimeout(()=>liveForm.current?.requestSubmit(),350);
    }
  }
  const hasFilters = Boolean(query.search || query.status || query.attention ||
    (!mentor&&(query.assignment||query.work||(query.sort&&query.sort!=="RECENT"))));
  return (
    <form
      ref={liveForm}
      onChange={mentor?liveRefresh:undefined}
      method="get"
      action={basePath}
      className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4 [&_label]:min-w-0"
    >
      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
        Search
        <Input
          name="search"
          type="search"
          defaultValue={query.search ?? ""}
          aria-label="Search my projects"
          placeholder="Search project title, course or slug"
          className="w-full sm:w-[300px]"
        />
      </label>

      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
        Status
        <Select
          name="status"
          defaultValue={query.status ?? ""}
          className="w-full sm:w-[170px]"
        >
          <option value="">All statuses</option>
          {(mentor || learner ? mentorStatusOptions : statusOptions).map(
            ([value, label]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ),
          )}
        </Select>
      </label>

      {mentor || learner ? (
        <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
          Attention
          <Select
            name="attention"
            defaultValue={
              query.attention ?? ""
            }
            className="w-full sm:w-[210px]"
          >
            <option value="">
              All attention states
            </option>
            {mentor ? (
              <>
                <option value="MENTOR_REVIEW">Needs my review</option>
                <option value="MENTOR_REQUESTED">Meeting requests</option>
                <option value="MENTOR_STALLED">Stalled projects</option>
                <option value="MENTOR_MEETING_SOON">Meeting soon</option>
                <option value="MENTOR_ANY_ATTENTION">Any attention</option>
                <option value="MENTOR_NO_ATTENTION">No recorded attention</option>
              </>
            ) : null}
            {learner ? (
              <>
                <option value="LEARNER_ACTION">Needs my action</option>
                <option value="BLOCKED">Blocked</option>
              </>
            ) : null}
          </Select>
        </label>
      ) : null}

      <details className="w-full min-w-0" open={Boolean(query.assignment||query.work||(query.sort&&query.sort!=="RECENT")||(query.pageSize&&query.pageSize!==25))}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-link md:min-h-9">More filters</summary>
        <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {mentor ? (<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Sort
        <Select name="sort" defaultValue={query.sort ?? "RECENT"} className="w-full">
          <option value="RECENT">Recently updated</option><option value="TITLE">Title A–Z</option><option value="PROGRESS">Least recorded progress first</option><option value="PROGRESS_DESC">Most recorded progress first</option><option value="OPEN_TASKS">Most open tasks first</option><option value="TEAM_SIZE_DESC">Largest active team first</option><option value="TEAM_SIZE_ASC">Smallest active team first</option>
        </Select></label>) : null}
      {mentor ? (<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Assignment
        <Select name="assignment" defaultValue={query.assignment ?? ""}
          className="w-full">
          <option value="">All Mentor assignments</option><option value="PRIMARY">Primary mentor</option><option value="SUPPORTING">Supporting mentor</option>
        </Select>
      </label>) : null}

      {mentor ? (
        <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
          Recorded task coverage
          <Select name="work" defaultValue={query.work ?? ""}
            className="w-full">
            <option value="">All task coverage</option>
            <option value="NO_TASKS">No tracked tasks</option>
            <option value="HAS_OPEN_TASKS">Open tasks recorded</option>
            <option value="ALL_DONE">All recorded tasks done</option>
            <option value="HAS_DONE_TASKS">Some recorded tasks done</option>
          </Select>
        </label>
      ) : null}
      {learner ? (
        <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
          Work attention
          <Select name="work" defaultValue={query.work ?? ""}
            className="w-full">
            <option value="">All work</option>
            <option value="BLOCKED">Has blocked tasks</option>
            <option value="NO_TASKS">No tracked tasks yet</option>
          </Select>
        </label>
      ) : null}
      {learner ? (
        <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
          Sort projects
          <Select name="sort" defaultValue={query.sort ?? "RECENT"}
            className="w-full">
            <option value="RECENT">Recently updated</option>
            <option value="TITLE">Title A–Z</option>
            <option value="PROGRESS">Least progress first</option>
          </Select>
        </label>
      ) : null}
      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
        Rows
        <Select
          name="pageSize"
          defaultValue={String(
            query.pageSize ?? 25,
          )}
          className="w-full"
        >
          {(learner||mentor?[10,25,50]:[25,50,100]).map((size) => (
            <option
              key={size}
              value={size}
            >
              {size}
            </option>
          ))}
        </Select>
      </label>

        </div>
      </details>
      {!mentor?<Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">
        Apply
      </Button>:null}
      {hasFilters ? <Link
        href={basePath}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-body hover:bg-primary-subtle"
      >
        Clear filters
      </Link> : null}
    </form>
  );
}

export function ProjectParticipantPagination({
  basePath,
  query,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  query: ProjectParticipantListQuery;
  page: number;
  totalPages: number;
  total: number;
}) {
  function href(target: number) {
    const params = new URLSearchParams();
    if (query.search) {
      params.set("search", query.search);
    }
    if (query.status) {
      params.set("status", query.status);
    }
    if (query.assignment) params.set("assignment", query.assignment);
    if (query.attention) {
      params.set(
        "attention",
        query.attention,
      );
    }
    if (query.work) params.set("work", query.work);
    if (query.sort && query.sort !== "RECENT") params.set("sort", query.sort);
    if (
      query.pageSize &&
      query.pageSize !== 25
    ) {
      params.set(
        "pageSize",
        String(query.pageSize),
      );
    }
    if (target > 1) {
      params.set("page", String(target));
    }
    const value = params.toString();
    return value
      ? basePath + "?" + value
      : basePath;
  }

  const start=Math.max(1,Math.min(page-2,Math.max(1,totalPages-4)));
  const pages=Array.from({length:Math.min(totalPages,5)},(_,index)=>start+index);
  if(totalPages<=1)return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-body">
      <p className="w-full text-center m-0">
        {(basePath==="/learn/projects"||basePath==="/mentor/projects")
          ? ((total===0?0:(page-1)*(query.pageSize??25)+1)+"–"+
             Math.min(total,page*(query.pageSize??25))+" of "+total+" projects")
          : <>{total} result{total===1?"":"s"} · Page {page} of {totalPages}</>}
      </p>
      <nav aria-label="Project pages" className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={href(
            Math.max(1, page - 1),
          )}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={
            "inline-flex min-h-11 items-center rounded-lg border border-border px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] " +
            (page <= 1
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted")
          }
        >
          Previous
        </Link>
        {pages.map(value=><Link key={value} href={href(value)}
          aria-current={value===page?"page":undefined}
          aria-label={"Page "+value}
          className={"inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] "+
            (value===page?"border-primary bg-primary-subtle text-primary-text":"border-border hover:bg-muted")}>
          {value}
        </Link>)}
        <Link
          href={href(
            Math.min(
              totalPages,
              page + 1,
            ),
          )}
          aria-disabled={
            page >= totalPages
          }
          tabIndex={page >= totalPages ? -1 : undefined}
          className={
            "inline-flex min-h-11 items-center rounded-lg border border-border px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] " +
            (page >= totalPages
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted")
          }
        >
          Next
        </Link>
      </nav>
    </div>
  );
}
