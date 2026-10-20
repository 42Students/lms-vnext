import { Button } from "@/components/ui/button";
import Link from "next/link";
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

type SearchParams = {
  status?: string | string[];
  search?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
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
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  if (input.status) params.set("status", input.status);
  if (input.search) params.set("search", input.search);

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
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export default async function TpoStudentRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const raw = await searchParams;

  const parsed = tpoStudentRequestsQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    status: first(raw.status) || undefined,
    search: first(raw.search) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
  });

  if (tpoStudentRequestsHasInvalidUrlFilters(raw) || !parsed.success) {
    return (
      <div className="min-w-0 space-y-4 md:space-y-6">
        <PageHeader
          eyebrow="TPO · Students"
          title="Student Requests"
          description="College-wide placement exception and change requests."
        />
        <Alert tone="error">
          <h2 className="text-lg font-semibold text-foreground">
            Invalid request filters
          </h2>
          <p className="mt-2 text-sm text-body">
            No requests were loaded because one or more filters
            are invalid.
          </p>
          <Link
            href="/tpo/students/requests"
            className="lms-inline-link mt-4 inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
          >
            Clear filters
          </Link>
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
        eyebrow="TPO · Students"
        title="Student Requests"
        description="Read-only, college-scoped placement withdrawal, round reschedule and offer extension requests. Open the related placement job for operational context."
        actions={
          <Link
            href="/tpo/students"
            className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
          >
            Students intelligence
          </Link>
        }
      />

      <nav
        aria-label="Students workspace tabs"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        <Link
          href="/tpo/students"
          className="lms-inline-link inline-flex min-h-11 items-center border-b-2 border-transparent px-4 py-2 text-sm font-semibold text-body hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
        >
          Students roster
        </Link>
        <Link
          href="/tpo/students/requests"
          aria-current="page"
          className="lms-inline-link inline-flex min-h-11 items-center border-b-2 border-primary px-4 py-2 text-sm font-[650] text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
        >
          Requests
        </Link>
      </nav>

      <section className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-2 lg:grid-cols-5">
        <Link
          href={requestsHref(tpoStudentRequestShortcutFilters(query.search,query.pageSize))}
          aria-current={!query.status ? "page" : undefined}
          className={
            "min-w-0 border-b border-r p-4 last:border-r-0 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
            (!query.status
              ? "border-primary bg-primary-subtle"
              : "border-border bg-surface")
          }
        >
          <p className="text-sm font-semibold text-body">All requests</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
            {data.summary.total}
          </p>
        </Link>

        {STATUSES.map((status) => (
          <Link
            key={status}
            href={requestsHref(tpoStudentRequestShortcutFilters(query.search,query.pageSize,status))}
            aria-current={
              query.status === status ? "page" : undefined
            }
            className={
              "min-w-0 border-b border-r p-4 last:border-r-0 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
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
          </Link>
        ))}
      </section>

      <form
        action="/tpo/students/requests"
        method="get"
        className="grid min-w-0 gap-3 border-y border-border py-4 md:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-sm font-semibold text-body">
          Status
          <Select
            name="status"
            defaultValue={query.status ?? ""}
            className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-body">
          Search
          <Input
            name="search"
            type="search"
            maxLength={150}
            defaultValue={query.search ?? ""}
            placeholder="Student, roll, job or company"
            
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-body">
          Page size
          <Select
            name="pageSize"
            defaultValue={String(query.pageSize)}
            className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="25">25 requests</option>
            <option value="50">50 requests</option>
            <option value="100">100 requests</option>
          </Select>
        </label>

        <div className="md:col-span-3">
          <Button variant="primary"
            type="submit"
            className="min-h-11 md:min-h-9 px-5"
          >
            Apply filters
          </Button>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Request queue
            </h2>
            <p className="mt-1 text-sm text-body">
              {data.total} matching request
              {data.total === 1 ? "" : "s"}
              {" · "}showing {firstItem}–{lastItem}
            </p>
          </div>
          <Link
            href="/tpo/students/requests"
            className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
          >
            Clear filters
          </Link>
        </div>

        {data.requests.length === 0 ? (
          <div className="border-y border-border py-8">
            <p className="text-sm text-body">
              {data.total > 0
                ? "This page is outside the matching result range."
                : "No student requests match these filters."}
            </p>
            <Link
              href={requestsHref({
                ...baseFilters,
                page: 1,
              })}
              className="lms-inline-link mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
            >
              First page
            </Link>
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
                <p className="whitespace-pre-wrap break-words text-sm text-body">{request.reason}</p>
                {request.decisionNote ? <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  Decision: {request.decisionNote}
                </p> : null}
                <time dateTime={request.requestedAt.toISOString()} className="block text-xs text-muted-foreground">
                  {formatRequestedAt(request.requestedAt)} IST
                </time>
                <Link href={`/tpo/placements/jobs/${encodeURIComponent(request.jobId)}`}
                  className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                  Open placement job
                </Link>
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
                      <Link
                        href={`/tpo/placements/jobs/${encodeURIComponent(request.jobId)}`}
                        className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
                      >
                        Open placement job →
                      </Link>
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
              <Link
                href={requestsHref({
                  ...baseFilters,
                  page: data.page - 1,
                })}
                className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
              >
                Previous
              </Link>
            ) : null}

            {data.page < data.totalPages ? (
              <Link
                href={requestsHref({
                  ...baseFilters,
                  page: data.page + 1,
                })}
                className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
              >
                Next
              </Link>
            ) : null}
          </nav>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Approvals and rejections reuse the existing transactional request
          service, which applies the authoritative consequence and records
          the actor audit. Send-back is not represented as a persisted
          request status.
        </p>
      </section>
    </div>
  );
}
