import { legacyGridExportFilename,legacySavedViewExportFilename } from "@/modules/placements/grid-export-filename";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,programs,sections} from "@/db/schema";
import {tpoStudentExportViewName} from "@/modules/placements/tpo-students-url-guard";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

import { exportTpoStudentsCsv } from "@/modules/placements/tpo-students-csv";
import {
  getTpoStudentsIntelligence,
  tpoStudentsQueryObjectSchema,
  tpoStudentsRangeRefinement,
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

    // A saved view changes only the downloadable name, never the tenant or row scope.
    if(url.searchParams.getAll("view").length>1)
      return Response.json({error:"Repeated view names are not allowed"},{status:400});
    const raw=Object.fromEntries(url.searchParams.entries());
    const savedViewRequested=raw.view!==undefined;
    const viewName=!savedViewRequested?"students":tpoStudentExportViewName(raw.view);
    if(!viewName)return Response.json({error:"Invalid saved view name"},{status:400});
    delete raw.view;
    // Export has no caller-controlled page, page size or collegeId.
    const filters = tpoStudentsQueryObjectSchema
      .omit({
        collegeId: true,
        page: true,
        pageSize: true,
      })
      .superRefine(tpoStudentsRangeRefinement)
      .parse(
        raw,
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

    const scopedRows=result.exportRows??[];
    // A section name is only attached after a same-college join; selected
    // membership class IDs alone are not authority to read another college.
    const classIds=[...new Set(scopedRows.flatMap(row=>row.classIds))];
    const sectionNames=classIds.length?await getDb().select({
      id:sections.id,name:sections.name,
    }).from(sections)
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(eq(departments.collegeId,context.membership.collegeId),
        inArray(sections.id,classIds))):[];
    const csv=exportTpoStudentsCsv(scopedRows,{},
      Object.fromEntries(sectionNames.map(row=>[row.id,row.name])));

    return new Response(`﻿${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="' + (savedViewRequested?legacySavedViewExportFilename(viewName, "csv"):
            legacyGridExportFilename(viewName, "csv")) + '"',
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
