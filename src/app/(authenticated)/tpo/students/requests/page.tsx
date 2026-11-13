import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {Select} from "@/components/ui/select";
import {Table} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoRequestDecisionControl } from "@/components/placements/tpo-request-decision-control";
import {tpoStudentRequestShortcutFilters} from "@/modules/placements/tpo-student-request-shortcut-model";
import {tpoStudentRequestsHasInvalidUrlFilters} from "@/modules/placements/tpo-student-requests-url-model";
import {
  listTpoStudentRequests,
  tpoStudentRequestsQuerySchema,
} from "@/modules/placements/tpo-students-service";
import {Input} from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateTimeFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";

import { ROLE } from "@/modules/identity/roles";
type SearchParams = {
  status?: string | string[];
  search?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  includeDecided?: string | string[];
  decidedDays?: string | string[];
};

type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

const STATUSES: readonly RequestStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function requestsHref(input: {
  status?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  includeDecided?:boolean | undefined;
  decidedDays?:number|"ALL"|undefined;
}) {
  const params = new URLSearchParams();

  if (input.status) params.set("status", input.status);
  if (input.search) params.set("search", input.search);
  if (input.includeDecided) {
    params.set("includeDecided","1");
    params.set("decidedDays",input.decidedDays==="ALL"?"0":String(input.decidedDays??30));
  }

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  if (input.pageSize && input.pageSize !== 25) {
    params.set("pageSize", String(input.pageSize));
  }

  const query = params.toString();

  return query
    ? `/tpo/students/requests?${query}`
    : "/tpo/students/requests";
}

function requestTone(
  status: string,
): "neutral" | "info" | "success" | "error" {
  if (status === "PENDING") return "info";
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";
  return "neutral";
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLocaleLowerCase("en-IN")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatRequestedAt(value: Date) {
  return istDateTimeFormatter.format(value);
}

export default async function TpoStudentRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
    redirect("/dashboard");
  }

  const raw = await searchParams;

  const parsed = tpoStudentRequestsQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    status: first(raw.status) || undefined,
    search: first(raw.search) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
    includeDecided:first(raw.includeDecided)==="1"||
      ["APPROVED","REJECTED","CANCELLED"].includes(first(raw.status)??""),
    decidedDays:first(raw.decidedDays)==="0"?"ALL":first(raw.decidedDays)||undefined,
  });

  if (tpoStudentRequestsHasInvalidUrlFilters(raw) || !parsed.success) {
    return (
      <div className="min-w-0 space-y-4 md:space-y-6">
        <PageHeader
           title="Student Requests"
          description="College-wide placement exception and change requests."
        />
        <Alert tone="error">
          <Heading level={2} size="lg" className="text-foreground">
            Invalid request filters
          </Heading>
          <p className="mt-2 text-sm text-body">
            No requests were loaded because one or more filters
            are invalid.
          </p>
          <TextLink
            href="/tpo/students/requests"
            className="mt-4 inline-flex min-h-11 items-center md:min-h-9"
          >
            Clear filters
          </TextLink>
        </Alert>
      </div>
    );
  }

  const query = parsed.data;

  const data = await listTpoStudentRequests(context, query);

  const counts: Record<RequestStatus, number> = {
    PENDING: data.summary.pending,
    APPROVED: data.summary.approved,
    REJECTED: data.summary.rejected,
    CANCELLED: data.summary.cancelled,
  };

  const baseFilters = {
    status: query.status,
    search: query.search,
    pageSize: query.pageSize,
    includeDecided:query.includeDecided,
    decidedDays:query.decidedDays,
  };

  const firstItem =
    data.total === 0
      ? 0
      : (data.page - 1) * data.pageSize + 1;

  const lastItem = Math.min(
    data.total,
    data.page * data.pageSize,
  );

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
         title="Student Requests"
        description="Read-only, college-scoped placement withdrawal, round reschedule and offer extension requests. Open the related placement job for operational context."
        actions={
          <ButtonLink variant="secondary"
            href="/tpo/students"
          >
            Students intelligence
          </ButtonLink>
        }
      />

      <nav
        aria-label="Students workspace tabs"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        <TextLink variant="bare"
          href="/tpo/students"
          className="lms-inline-link inline-flex min-h-11 items-center border-b-2 border-transparent px-4 py-2 text-sm font-semibold text-body hover:bg-muted focus-ring md:min-h-9"
        >
          Students roster
        </TextLink>
        <TextLink
          href="/tpo/students/requests"
          aria-current="page"
          className="inline-flex min-h-11 items-center border-b-2 border-primary px-4 py-2 text-sm md:min-h-9"
        >
          Requests
        </TextLink>
      </nav>

      <nav aria-label="Request decision history" className="flex flex-wrap gap-3 border-b border-border pb-3 text-sm">
        <TextLink href={requestsHref({status:"PENDING",search:query.search,pageSize:query.pageSize})}
          aria-current={!query.includeDecided?"page":undefined}
          className="inline-flex min-h-11 items-center md:min-h-9">Pending only</TextLink>
        <TextLink href={requestsHref({search:query.search,pageSize:query.pageSize,includeDecided:true,decidedDays:30})}
          aria-current={query.includeDecided&&query.decidedDays!== "ALL"?"page":undefined}
          className="inline-flex min-h-11 items-center md:min-h-9">Last 30 days of decisions</TextLink>
        <TextLink href={requestsHref({search:query.search,pageSize:query.pageSize,includeDecided:true,decidedDays:"ALL"})}
          aria-current={query.includeDecided&&query.decidedDays==="ALL"?"page":undefined}
          className="inline-flex min-h-11 items-center md:min-h-9">All history</TextLink>
      </nav>
      <section className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border sm:grid-cols-3 xl:grid-cols-5">
        <TextLink variant="bare"
          href={requestsHref({...tpoStudentRequestShortcutFilters(query.search,query.pageSize),
            includeDecided:query.includeDecided,decidedDays:query.decidedDays})}
          aria-current={!query.status ? "page" : undefined}
          className={
            "min-w-0 border-b border-r p-4 last:border-r-0 hover:border-primary focus-ring " +
            (!query.status
              ? "border-primary bg-primary-subtle"
              : "border-border bg-surface")
          }
        >
          <p className="text-sm font-semibold text-body">{query.includeDecided?"All requests":"Outstanding requests"}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
            {data.summary.total}
          </p>
        </TextLink>

        {STATUSES.map((status) => (
          <TextLink variant="bare"
            key={status}
            href={requestsHref({...tpoStudentRequestShortcutFilters(query.search,query.pageSize,status),
              includeDecided:status!=="PENDING"||query.includeDecided,
              decidedDays:query.decidedDays})}
            aria-current={
              query.status === status ? "page" : undefined
            }
            className={
              "min-w-0 border-b border-r p-4 last:border-r-0 hover:border-primary focus-ring " +
              (query.status === status
                ? "border-primary bg-primary-subtle"
                : "border-border bg-surface")
            }
          >
            <p className="text-sm font-semibold text-body">
              {humanize(status)}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {counts[status]}
            </p>
          </TextLink>
        ))}
      </section>

      <form
        action="/tpo/students/requests"
        method="get"
        className="grid min-w-0 gap-3 border-y border-border py-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <Label className="flex flex-col gap-2">
          Status
          <Select
            name="status"
            defaultValue={query.status ?? ""}
            className="min-h-11 md:min-h-9"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </Select>
        </Label>

        <Label className="flex flex-col gap-2">
          Search
          <Input
            name="search"
            type="search"
            maxLength={150}
            defaultValue={query.search ?? ""}
            placeholder="Student, roll, job or company"
            
          />
        </Label>

        <Label className="flex flex-col gap-2">
          Page size
          <Select
            name="pageSize"
            defaultValue={String(query.pageSize)}
            className="min-h-11 md:min-h-9"
          >
            <option value="25">25 requests</option>
            <option value="50">50 requests</option>
            <option value="100">100 requests</option>
          </Select>
        </Label>

        {query.includeDecided?<><input type="hidden" name="includeDecided" value="1"/>
          <input type="hidden" name="decidedDays" value={query.decidedDays==="ALL"?"0":String(query.decidedDays)}/>
        </>:null}
        <div className="sm:col-span-2 xl:col-span-3">
          <Button variant="primary"
            type="submit"
            className="min-h-11 w-full px-6 sm:w-auto md:min-h-9"
          >
            Apply filters
          </Button>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading level={2} size="lg" className="text-foreground">
              Request queue
            </Heading>
            <p className="mt-1 text-sm text-body">
              {formatNumberIN(data.total)} matching request
              {data.total === 1 ? "" : "s"}
              {" · "}showing {firstItem}–{lastItem}
            </p>
          </div>
          <TextLink
            href="/tpo/students/requests"
            className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto sm:justify-start md:min-h-9"
          >
            Clear filters
          </TextLink>
        </div>

        {data.requests.length === 0 ? (
          <div className="border-y border-border py-8">
            <p className="text-sm text-body">
              {data.total > 0
                ? "This page is outside the matching result range."
                : "No student requests match these filters."}
            </p>
            <TextLink
              href={requestsHref({
                ...baseFilters,
                page: 1,
              })}
              className="mt-3 inline-flex min-h-11 items-center text-sm md:min-h-9"
            >
              First page
            </TextLink>
          </div>
        ) : (
          <>
          <ul aria-label="Student requests mobile view" className="space-y-3 md:hidden">
            {data.requests.map((request) => (
              <li key={request.id} className="min-w-0 space-y-3 border-b border-border py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-foreground">{request.studentName}</p>
                    <p className="text-xs text-muted-foreground">{request.rollNumber ?? "No roll number"}</p>
                  </div>
                  <StatusBadge tone={requestTone(request.status)}>{humanize(request.status)}</StatusBadge>
                </div>
                <p className="text-sm font-semibold">{humanize(request.requestType)}</p>
                <p className="break-words text-sm text-body">{request.jobTitle} · {request.companyName}</p>
                <Disclosure title="Request details" className="min-w-0 border-t border-border pt-2" contentClassName="min-w-0 pt-2">
                <p className="whitespace-pre-wrap break-words text-sm text-body">{request.reason}</p>
                {request.decisionNote ? <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  Decision: {request.decisionNote}
                </p> : null}
                </Disclosure>
                <time dateTime={request.requestedAt.toISOString()} className="block text-xs text-muted-foreground">
                  {formatRequestedAt(request.requestedAt)} IST
                </time>
                <TextLink href={`/tpo/placements/jobs/${encodeURIComponent(request.jobId)}`}
                  className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto sm:justify-start md:min-h-9">
                  Open placement job
                </TextLink>
                {request.status==="PENDING" ? <TpoRequestDecisionControl
                  requestId={request.id} expectedUpdatedAt={request.updatedAt.toISOString()}
                  requestType={request.requestType}/> : null}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table scrollLabel="Student requests" className="min-w-[65rem]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Student</th>
                  <th scope="col" className="px-4 py-3">Request</th>
                  <th scope="col" className="px-4 py-3">Job / company</th>
                  <th scope="col" className="px-4 py-3">Requested</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Context</th>
                  <th scope="col" className="px-4 py-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">
                        {request.studentName}
                      </p>
                      <p className="mt-1 text-xs text-body">
                        {request.rollNumber ?? "No roll number"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">
                        {humanize(request.requestType)}
                      </p>
                      <p className="mt-2 max-w-xs whitespace-pre-wrap text-xs text-body">
                        {request.reason}
                      </p>
                      {request.decisionNote ? (
                        <p className="mt-2 max-w-xs whitespace-pre-wrap text-xs text-muted-foreground">
                          Decision: {request.decisionNote}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">
                        {request.jobTitle}
                      </p>
                      <p className="mt-1 text-xs text-body">
                        {request.companyName}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-body">
                      <time dateTime={request.requestedAt.toISOString()}>
                        {formatRequestedAt(request.requestedAt)} IST
                      </time>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge tone={requestTone(request.status)}>
                        {humanize(request.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4">
                      <TextLink
                        href={`/tpo/placements/jobs/${encodeURIComponent(request.jobId)}`}
                        className="inline-flex min-h-11 items-center md:min-h-9"
                      >
                        Open placement job →
                      </TextLink>
                    </td>
                    <td className="px-4 py-4">
                      {request.status === "PENDING" ? (
                        <TpoRequestDecisionControl
                          requestId={request.id}
                          expectedUpdatedAt={request.updatedAt.toISOString()}
                          requestType={request.requestType}
                        />
                      ) : <span className="text-xs text-muted-foreground">Decision recorded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-body">
            Page {data.page} of {Math.max(1, data.totalPages)}
          </p>

          <nav
            aria-label="Student Requests pagination"
            className="flex flex-wrap gap-2"
          >
            {data.page > 1 ? (
              <ButtonLink variant="secondary"
                href={requestsHref({
                  ...baseFilters,
                  page: data.page - 1,
                })}
              >
                Previous
              </ButtonLink>
            ) : null}

            {data.page < data.totalPages ? (
              <ButtonLink variant="secondary"
                href={requestsHref({
                  ...baseFilters,
                  page: data.page + 1,
                })}
              >
                Next
              </ButtonLink>
            ) : null}
          </nav>
        </div>

        <Disclosure title="Request decision policy notes" className="min-w-0" contentClassName="pt-2">
        <p className="text-xs leading-5 text-muted-foreground">
          Approvals and rejections reuse the existing transactional request
          service, which applies the authoritative consequence and records
          the actor audit. Send-back is not represented as a persisted
          request status.
        </p>
        </Disclosure>
      </section>
    </div>
  );
}
