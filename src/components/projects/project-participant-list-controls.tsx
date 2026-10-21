"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useEffect,useRef} from "react";
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
  function liveRefresh(){
    if(!mentor)return;
    if(liveTimer.current)clearTimeout(liveTimer.current);
    liveTimer.current=setTimeout(()=>liveForm.current?.requestSubmit(),350);
  }
  const hasFilters = Boolean(query.search || query.status || query.attention || query.assignment ||
    query.work || (query.sort && query.sort !== "RECENT") ||
    (query.page && query.page>1) || (query.pageSize && query.pageSize!==25));
  return (
    <form
      ref={liveForm}
      onInput={mentor?liveRefresh:undefined}
      onChange={mentor?liveRefresh:undefined}
      method="get"
      action={basePath}
      className={mentor?"grid min-w-0 items-end gap-3 border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-4 [&_label]:min-w-0":"grid min-w-0 items-end gap-3 border-b border-border pb-4 min-[768px]:grid-cols-2 lg:grid-cols-4 [&_label]:min-w-0"}
    >
      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
        Search
        <Input
          name="search"
          type="search"
          defaultValue={query.search ?? ""}
          aria-label="Search my projects"
          placeholder="Search project title, course or slug"
          className="w-full"
        />
      </label>

      <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
        Status
        <Select
          name="status"
          defaultValue={query.status ?? ""}
          className="w-full"
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
            className="w-full"
          >
            <option value="">
              All attention states
            </option>
            {mentor ? (
              <>
                <option value="MENTOR_REVIEW">Needs my review</option>
                <option value="BLOCKED">Blocked</option>
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

      <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">
        Apply
      </Button>
      {!mentor || hasFilters ? <Link
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
      <p className="m-0">
        {(basePath==="/learn/projects"||basePath==="/mentor/projects")
          ? ((total===0?0:(page-1)*(query.pageSize??25)+1)+"–"+
             Math.min(total,page*(query.pageSize??25))+" of "+total+" projects")
          : <>{total} result{total===1?"":"s"} · Page {page} of {totalPages}</>}
      </p>
      {totalPages>1?<div className="flex gap-2">
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
      </div> : null}
    </div>
  );
}
