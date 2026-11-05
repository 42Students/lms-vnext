"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

export type ProjectAdminCollectionQuery = {
  view?:"cards"|"table";
  fromMentorId?: string;
  focusedProjectId?:string;
  riskBucket?: "STALLED" | "BLOCKER" | "REVIEW";
  riskSort?: "INACTIVE" | "INACTIVE_DESC" | "WORKSPACE" | "WORKSPACE_DESC" | "SEVERITY";
  q?: string;
  status?:
    | "PLANNED"
    | "ACTIVE"
    | "IN_PROGRESS"
    | "READY"
    | "BLOCKED"
    | "COMPLETED"
    | "ARCHIVED";
  sort?:"SUBMITTED_DESC"|"PENDING_DESC"|"REVISIONS_DESC";
  submissionStatus?:
    | "DRAFT"
    | "SUBMITTED"
    | "CHANGES_REQUESTED"
    | "APPROVED"
    | "UNDER_REVIEW"
    | "LOCKED"
    | "DRAFT_REVISING";
  page?: number;
  pageSize?: number;
};

/** Historic Ready is a readiness rollup; Blocked derives from risk,
 * not a lifecycle status. Do not mislabel persisted COMPLETED or ARCHIVED.
 */
export const LEGACY_WORKSPACE_FILTER_LABELS=[
 "Active","In progress","Ready","Blocked","Archived",
] as const;
const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;

const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "APPROVED",
  "UNDER_REVIEW",
  "LOCKED",
  "DRAFT_REVISING",
] as const;

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function ProjectAdminFilters({
  query,
  includeSubmissionStatus = false,
  includeRiskSort = false,
  legacyWorkspaces = false,
  atRiskHref = "/admin/projects/at-risk",
  searchParamName,
  filterView,
}: {
  query: ProjectAdminCollectionQuery;
  includeSubmissionStatus?: boolean;
  includeRiskSort?: boolean;
  legacyWorkspaces?: boolean;
  atRiskHref?:string;
  searchParamName?:"q"|"search";
  searchPlaceholder?:string;
  filterView?: "NOT_SUBMITTED";
}) {
  const router=useRouter();
  // Risk listings keep a fixed 25-row page, unlike the other workspaces.
  const fixedRiskPageSize=includeRiskSort;
  const searchKey=searchParamName??(legacyWorkspaces?"search":"q");
  // Clearing filters must not leave an at-risk bucket, selected mentor or
  // archived workspace view; those are route context, not disposable filters.
  const clearHref=(()=>{
    const params=new URLSearchParams();
    if(filterView)params.set("view",filterView);
    else if(query.view)params.set("view",query.view);
    if(query.fromMentorId)params.set("fromMentorId",query.fromMentorId);
    if(query.focusedProjectId)params.set("projectId",query.focusedProjectId);
    if(query.riskBucket)params.set("riskBucket",query.riskBucket);
    const values=params.toString();
    return values?"?"+values:"?";
  })();
  const [searchText,setSearchText]=useState(query.q??"");
  const updateUrl=useCallback((key:string,value:string)=>{
    const current=new URLSearchParams(window.location.search);
    if(value.trim())current.set(key,value.trim());
    else current.delete(key);
    current.delete("page");
    const qs=current.toString();
    router.replace(window.location.pathname+(qs?"?"+qs:""),{scroll:false});
  },[router]);
  useEffect(()=>{setSearchText(query.q??"");},[query.q]);
  useEffect(()=>{
    if(searchText===(query.q??""))return;
    const timer=window.setTimeout(()=>updateUrl(searchKey,searchText),350);
    return ()=>window.clearTimeout(timer);
  },[searchText,query.q,searchKey,updateUrl]);
  return (
    <form method="get" onSubmit={event=>{event.preventDefault();
      updateUrl(searchKey,searchText);}}
      role="search"
      className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]"
    >
      <Label stack className="min-w-0">
        Search
        <span className="flex items-center gap-1">
          <Input
            name={searchKey}
            type="search"
            placeholder={legacyWorkspaces ? "Search title or slug" : "Workspace title or slug"}
            className="w-full min-w-0"
            value={searchText}
            onChange={event=>setSearchText(event.target.value)}
          />
          {searchText?<Button variant="secondary" type="button" aria-label="Clear search"
            onClick={()=>{setSearchText("");updateUrl(searchKey,"");}}
            className="min-w-11 md:min-w-9">
            ×
          </Button>:null}
        </span>
      </Label>
      <Label stack className="min-w-0">
        Workspace status
        <Select
          name="status"
          defaultValue={query.status ?? ""}
          onChange={event=>updateUrl("status",event.target.value)}
          className="w-full"
        >
          <option value="">All statuses</option>
          {(legacyWorkspaces?
            (["ACTIVE","IN_PROGRESS","READY","BLOCKED","ARCHIVED",
              ...(query.status==="PLANNED"?["PLANNED" as const]:[]),
              ...(query.status==="COMPLETED"?["COMPLETED" as const]:[])] as const):
            PROJECT_STATUSES).map((status) => (
            <option key={status} value={status}>
              {status==="IN_PROGRESS"?"In progress":label(status)}
            </option>
          ))}
        </Select>
      </Label>
      {legacyWorkspaces?<p className="text-xs text-muted-foreground">
        Ready and Blocked use saved workspace phase and blocker signals.
        <TextLink href={atRiskHref} className="ml-1">
          View all risk signals</TextLink>
      </p>:null}
      {filterView?<input type="hidden" name="view" value={filterView}/>:query.view?<input type="hidden" name="view" value={query.view}/>:null}
      {query.fromMentorId ? <input type="hidden" name="fromMentorId" value={query.fromMentorId} /> : null}
      {query.focusedProjectId ? <input type="hidden" name="projectId" value={query.focusedProjectId} /> : null}
      {query.riskBucket ? <input type="hidden" name="riskBucket" value={query.riskBucket} /> : null}
      {query.sort&&query.sort!=="SUBMITTED_DESC"?
        <input type="hidden" name="sort" value={query.sort}/>:null}
      {includeRiskSort ? (
        <Label stack className="min-w-0">
          Sort by
          <Select name="riskSort" defaultValue={query.riskSort??"INACTIVE"}
            onChange={event=>updateUrl("riskSort",event.target.value)}
            className="w-full">
            <option value="INACTIVE">Inactive (most days first)</option>
            <option value="INACTIVE_DESC">Inactive (fewest days first)</option>
            <option value="SEVERITY">Severity</option>
            <option value="WORKSPACE">Workspace</option>
            <option value="WORKSPACE_DESC">Workspace (Z–A)</option>
          </Select>
        </Label>
      ) : null}
      {includeSubmissionStatus ? (
        <Label stack className="min-w-0">
          Submission status
          <Select
            name="submissionStatus"
            defaultValue={query.submissionStatus ?? ""}
            onChange={event=>updateUrl("submissionStatus",event.target.value)}
            className="w-full"
          >
            <option value="">All submissions</option>
            {SUBMISSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status==="UNDER_REVIEW"?"Under Review":status==="DRAFT_REVISING"?"Draft (revising)":label(status)}
              </option>
            ))}
          </Select>
        </Label>
      ) : null}
      {fixedRiskPageSize?<input type="hidden" name="pageSize" value="25"/>:<Label stack className="min-w-0">
        Rows
        <Select
          name="pageSize"
          defaultValue={String(query.pageSize ?? (legacyWorkspaces ? 20 : 25))}
          onChange={event=>updateUrl("pageSize",event.target.value)}
          className="w-full"
        >
          {[10, 20, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </Label>}
      <Button
        type="submit"
        className="min-h-11 w-full md:min-h-9"
      >
        Apply
      </Button>
      <ButtonLink variant="secondary"
        href={clearHref}
        className="w-auto"
      >
        Clear
      </ButtonLink>
    </form>
  );
}

export function ProjectAdminPagination({
  basePath,
  query,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  query: ProjectAdminCollectionQuery;
  page: number;
  totalPages: number;
  total: number;
}) {
  const href = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set(basePath === "/admin/projects" ? "search" : "q", query.q);
    if (query.view) params.set("view", query.view);
    if (query.fromMentorId) params.set("fromMentorId", query.fromMentorId);
    if (query.focusedProjectId) params.set("projectId",query.focusedProjectId);
    if (query.riskBucket) params.set("riskBucket", query.riskBucket);
    if (query.riskSort) params.set("riskSort", query.riskSort);
    if (query.status) {
      params.set("status", query.status);
    }
    if(query.sort&&query.sort!=="SUBMITTED_DESC")params.set("sort",query.sort);
    if (query.submissionStatus) {
      params.set(
        "submissionStatus",
        query.submissionStatus,
      );
    }
    if (query.pageSize && !(basePath === "/admin/projects" && query.pageSize === 20)) {
      params.set(
        "pageSize",
        String(query.pageSize),
      );
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const value = params.toString();
    return value
      ? basePath + "?" + value
      : basePath;
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm text-body">
      <p className="m-0 tabular-nums">
        {total===0?0:(page-1)*(query.pageSize??(basePath==="/admin/projects"?20:25))+1}–{Math.min(total,page*(query.pageSize??(basePath==="/admin/projects"?20:25)))} of {total} {query.status==="ARCHIVED"?"deleted workspaces":"workspaces"}
      </p>
      <Pagination page={page} pageCount={totalPages} hrefForPage={href}
        label="Project workspaces pages" />
    </div>
  );
}
