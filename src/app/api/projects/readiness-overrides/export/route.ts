import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listCollegeActiveReadinessOverrides } from "@/modules/projects/admin-readiness-overrides-service";

export const runtime = "nodejs";

import { projectReadinessOverrideCsvCell } from "@/modules/projects/readiness-overrides-export-model";
import {z} from "zod";

export async function GET(request: Request) {
  try {
    const collegeId = new URL(request.url).searchParams.get("collegeId");
    if (!collegeId) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const query=new URL(request.url).searchParams;
    const selected=query.get("projectIds");
    const ids=selected===null?null:z.array(z.string().uuid()).min(1).max(25)
      .parse(selected.length<=925?selected.split(","):[]);
    const rows = await listCollegeActiveReadinessOverrides(await getCurrentRequestContext(), collegeId);
    const visible=ids?rows.filter(row=>ids.includes(row.projectId)):rows;
    const lines = [
      ["Workspace", "Workspace ID", "Override direction", "Override note", "Overridden by", "Overridden at"].map(projectReadinessOverrideCsvCell).join(","),
      ...visible.map(row => [row.workspace,row.projectId,row.direction,row.note,row.by,
        row.at.toISOString()].map(projectReadinessOverrideCsvCell).join(",")),
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
