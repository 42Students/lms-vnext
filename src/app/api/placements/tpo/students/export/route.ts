import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

import { exportTpoStudentsCsv } from "@/modules/placements/tpo-students-csv";
import {
  getTpoStudentsIntelligence,
  tpoStudentsQuerySchema,
} from "@/modules/placements/tpo-students-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TPO-only, read-only CSV export.
 *
 * The authenticated membership supplies collegeId. Untrusted query
 * parameters may refine the roster but cannot select another college.
 * Export rows are calculated inside the already-authorized service,
 * using the same journey/branch/search filters as the HTML roster.
 */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();

    if (
      !context.membership ||
      !hasMembershipRole(context, "TPO")
    ) {
      throw new AuthorizationError("placements.manage");
    }
    await requireTpoBatchActor(context);

    const url = new URL(request.url);

    // Export has no caller-controlled page, page size or collegeId.
    const filters = tpoStudentsQuerySchema
      .omit({
        collegeId: true,
        page: true,
        pageSize: true,
      })
      .parse(
        Object.fromEntries(url.searchParams.entries()),
      );

    const result = await getTpoStudentsIntelligence(
      context,
      {
        ...filters,
        collegeId: context.membership.collegeId,
        page: 1,
        pageSize: 25,
      },
      { includeExportRows: true },
    );

    const csv = exportTpoStudentsCsv(result.exportRows ?? []);

    return new Response(`﻿${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="' + gridExportFilename("tpo-students", "csv") + '"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Placement-Registration-Data":
          result.definitions.registrationsAvailable
            ? "available"
            : "unavailable",
        "X-Placement-External-Offers":
          result.definitions.externalOffersAvailable
            ? "available"
            : "unavailable",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0",
    );
    return response;
  }
}
