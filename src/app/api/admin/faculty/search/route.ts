import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/request-body";
import {
  adminScopedFacultyStats,
  existsAdminScopedFacultyName,
  listAdminScopedPeople,
  listAdminScopedPeopleSuggestions,
  recordAdminScopedFacultySelection,
} from "@/modules/admin-ui/super-admin-scoped-people-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": CACHE.PRIVATE };

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const params = new URL(request.url).searchParams;
    if (new Set(params.keys()).size !== [...params.keys()].length) {
      return Response.json({ error: "INVALID_QUERY" }, { status: 400 });
    }
    const mode = params.get("mode") ?? "suggestions";
    const q = params.get("query") ?? params.get("q") ?? "";
    if (q.length > 100) return Response.json({ error: "INVALID_QUERY" }, { status: 400 });
    const parsedLimit = Number(params.get("limit") ?? 15);
    if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 15) {
      return Response.json({ error: "INVALID_LIMIT" }, { status: 400 });
    }
    if (mode === "exists") {
      return Response.json(
        { exists: await existsAdminScopedFacultyName(context, q) },
        { headers: privateHeaders },
      );
    }
    if (mode === "stats") {
      return Response.json(await adminScopedFacultyStats(context), { headers: privateHeaders });
    }
    if (mode === "suggestions") {
      return Response.json(
        { items: await listAdminScopedPeopleSuggestions(context, "FACULTY", q, parsedLimit) },
        { headers: privateHeaders },
      );
    }
    if (mode === "search") {
      const data = await listAdminScopedPeople(context, "FACULTY", {
        q,
        query: undefined,
        status: "ALL",
        page: params.get("page") ?? 1,
        pageSize: params.get("pageSize") ?? 25,
        departmentName: params.get("departmentName") ?? "",
        deptId: params.get("deptId") ?? undefined,
        facultyType: params.get("facultyType") ?? undefined,
        collegeId: params.get("collegeId") ?? undefined,
      });
      return Response.json(data, { headers: privateHeaders });
    }
    return Response.json({ error: "INVALID_MODE" }, { status: 400 });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const _p = await readBoundedJsonRequest(request, 8192);
    if (!_p.ok) return Response.json({ error: "INVALID_BODY" }, { status: 400 });
    const body: unknown = _p.value;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "INVALID_BODY" }, { status: 400 });
    }
    const id = (body as Record<string, unknown>)["membershipId"];
    if (typeof id !== "string") {
      return Response.json({ error: "INVALID_MEMBERSHIP" }, { status: 400 });
    }
    const recorded = await recordAdminScopedFacultySelection(context, id);
    return Response.json({ recorded }, { status: recorded ? 200 : 404, headers: privateHeaders });
  },
);
