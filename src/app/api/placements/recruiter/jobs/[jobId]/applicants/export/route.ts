import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { hrApplicantFilterSchema } from "@/modules/placements/hr-job-applicants-model";
import { buildHrApplicantCsv, HR_APPLICANT_EXPORT_CAP } from "@/modules/placements/hr-applicant-export-model";
import { getHrJobRead } from "@/modules/placements/hr-job-read-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { jobId } = await params;
    const url = new URL(request.url);
    const filters = hrApplicantFilterSchema.parse({
      tab: "applicants",
      stage: url.searchParams.get("stage") ?? undefined,
      page: 1,
    });
    const context = await getCurrentRequestContext();
    const first = await getHrJobRead(context, jobId, filters);
    const total = filters.stage === "SHORTLISTED" ? first.applicants.counts.shortlisted :
      filters.stage === "WITHDRAWN" ? first.applicants.counts.withdrawn : first.applicants.counts.all;
    const rows = [...first.applicants.rows];
    const lastPage = Math.min(Math.ceil(HR_APPLICANT_EXPORT_CAP / first.applicantsPage.pageSize),
      first.applicantsPage.pages);
    for (let page = 2; page <= lastPage; page += 1) {
      const next = await getHrJobRead(context, jobId, { ...filters, page });
      rows.push(...next.applicants.rows);
    }
    const exportResult = buildHrApplicantCsv(rows, total);
    return new Response(exportResult.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="recruiter-shared-applicants.csv"',
        "Cache-Control": "private, no-store",
        "X-Export-Omitted": String(exportResult.omitted),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
