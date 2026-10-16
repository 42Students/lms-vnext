import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listCollegeActiveReadinessOverrides } from "@/modules/projects/admin-readiness-overrides-service";

export const runtime = "nodejs";

function csvCell(value: string) {
  const guarded = /^[=+@-]/.test(value) ? "'" + value : value;
  return '"' + guarded.replaceAll('"', '""') + '"';
}

export async function GET(request: Request) {
  try {
    const collegeId = new URL(request.url).searchParams.get("collegeId");
    if (!collegeId) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const rows = await listCollegeActiveReadinessOverrides(await getCurrentRequestContext(), collegeId);
    const lines = [
      ["Workspace", "Override", "Note", "By", "At"].map(csvCell).join(","),
      ...rows.map(row => [row.workspace, row.direction, row.note, row.by,
        row.at.toISOString()].map(csvCell).join(",")),
    ];
    return new Response("\uFEFF" + lines.join("\r\n") + "\r\n", {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="active-readiness-overrides.csv"',
        "cache-control": "private, no-store",
      },
    });
  } catch (error) { return apiErrorResponse(error); }
}
