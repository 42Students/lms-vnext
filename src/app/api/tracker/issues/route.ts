import { NextResponse } from "next/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { isSameOriginRequest } from "@/auth/origin";
import { createBugTrackerIssueForAdmin } from "@/modules/bug-tracker/report-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { parseTrackerIssuesApiQuery } from "@/modules/bug-tracker/issues-api-query";
import { trackerReportSchema } from "@/modules/bug-tracker/report-input-model";
import { BUG_ENVIRONMENTS, BUG_SEVERITIES } from "@/modules/bug-tracker/admin-validation";
import { BUG_STATUSES } from "@/modules/bug-tracker/workflow";
import { db10BugReports } from "@/db/schema/db10-bug-tracker";
import { getDb } from "@/db/client";
import { isSuperAdmin } from "@/modules/identity/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalid(field?: string, message?: string) {
  return NextResponse.json(
    { error: "INVALID_REQUEST", ...(field && message ? { fieldErrors: { [field]: message }, message } : {}) },
    { status: 400, headers: { "cache-control": "private, no-store" } },
  );
}

/**
 * The legacy tracker allowed an anonymous searchable index. DB10 deliberately
 * binds reports to authenticated users. The old
 * PublicTrackerLogsAccessController accepted POST {password} and returned
 * shared AuthResponse tokens; that incompatible shared-password grant is
 * deliberately removed, not hidden behind an equivalent token-minting route.
 * Active membership/individual login is required instead, with a verified
 * super-admin capability for full index reads. Reporters may search only their own
 * records; managers retain the cursor-based, scoped admin endpoint.
 */
export async function GET(request: Request) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_TRACKER_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const params = new URL(request.url).searchParams;
    if (isSuperAdmin(context)) {
      const query = parseTrackerIssuesApiQuery(params);
      if (!query) return invalid();
      const page = await listBugTrackerIssuesForAdmin(context, query);
      return NextResponse.json(page, { headers: { "cache-control": "private, no-store" } });
    }
    if (context.user.platformStatus !== "ACTIVE") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const allowed = new Set(["page", "size", "status", "severity", "environment", "q"]);
    for (const key of params.keys()) {
      if (!allowed.has(key) || params.getAll(key).length !== 1) return invalid();
    }
    const numeric = (field: "page" | "size", fallback: number, max: number) => {
      const raw = params.get(field);
      if (raw === null) return fallback;
      if (!/^[0-9]+$/.test(raw)) return null;
      const n = Number(raw);
      return Number.isSafeInteger(n) && n >= (field === "page" ? 0 : 1) && n <= max ? n : null;
    };
    const page = numeric("page", 0, 100000);
    const size = numeric("size", 20, 100);
    if (page === null) return invalid("page", "Invalid page");
    if (size === null) return invalid("size", "Invalid size");
    const status = params.get("status"), severity = params.get("severity");
    const environment = params.get("environment"), q = params.get("q")?.trim() ?? "";
    if (status && !(BUG_STATUSES as readonly string[]).includes(status)) return invalid("status", "Invalid status");
    if (severity && !(BUG_SEVERITIES as readonly string[]).includes(severity)) return invalid("severity", "Invalid severity");
    if (environment && !(BUG_ENVIRONMENTS as readonly string[]).includes(environment)) return invalid("environment", "Invalid environment");
    if (q.length > 200) return invalid("q", "Invalid search");
    const where = and(
      eq(db10BugReports.reporterUserId, context.user.id),
      status ? eq(db10BugReports.status, status) : undefined,
      severity ? eq(db10BugReports.severity, severity) : undefined,
      environment ? eq(db10BugReports.environment, environment) : undefined,
      q ? sql`(position(${q.toLowerCase()}::text in lower(${db10BugReports.publicId})) > 0 or position(${q.toLowerCase()}::text in lower(${db10BugReports.description})) > 0)` : undefined,
    );
    const db = getDb();
    const [totalRows, items] = await Promise.all([
      db.select({ total: count() }).from(db10BugReports).where(where),
      db.select({
        publicId: db10BugReports.publicId, page: db10BugReports.page,
        screen: db10BugReports.screen, section: db10BugReports.section,
        issueType: db10BugReports.issueType, severity: db10BugReports.severity,
        status: db10BugReports.status, environment: db10BugReports.environment,
        description: db10BugReports.description, createdAt: db10BugReports.createdAt,
        updatedAt: db10BugReports.updatedAt,
      }).from(db10BugReports).where(where)
        .orderBy(desc(db10BugReports.createdAt), desc(db10BugReports.id))
        .limit(size).offset(page * size),
    ]);
    const total = totalRows[0]?.total ?? 0;
    return NextResponse.json(
      { items, page, size, total, totalPages: Math.ceil(total / size) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return bugTrackerApiError(error);
  }
}

/** Reporter intake requires the signed-in user and same-origin protection. */
export async function POST(request: Request) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_TRACKER_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalid();
    }
    const parsed = trackerReportSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (!field || fields[field]) continue;
        const legacy = field === "status" || field === "environment" ||
          field === "accountRole" || field === "severity";
        fields[field] = legacy ? "Invalid " + (field === "accountRole" ? "account role" : field) : issue.message;
      }
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: Object.values(fields)[0] ?? "Invalid request", fieldErrors: fields },
        { status: 400, headers: { "cache-control": "private, no-store" } },
      );
    }
    const issue = await createBugTrackerIssueForAdmin(context, parsed.data);
    // Keep the existing vNext {issue} contract while exposing legacy issue fields.
    return NextResponse.json({ issue, ...issue }, {
      status: 201, headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return bugTrackerApiError(error);
  }
}
