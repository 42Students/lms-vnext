import { z } from "zod";
import { facultySubmissionFilterSchema } from "./faculty-assignment-submissions-model";

export const facultyReportCsvRequestSchema = z.discriminatedUnion("kind",[
  z.object({kind:z.literal("assignment"),assessmentId:z.string().uuid(),
    deliveryId:z.string().uuid(),filter:facultySubmissionFilterSchema.optional()}).strict(),
  z.object({kind:z.literal("quiz"),assessmentId:z.string().uuid(),
    deliveryId:z.string().uuid(),filter:z.enum(["ALL","ATTEMPTED","NOT_ATTEMPTED"]).optional()}).strict(),
]);

export function facultyReportCsvHref(raw: unknown) {
  const input = facultyReportCsvRequestSchema.parse(raw);
  const params=new URLSearchParams({deliveryId:input.deliveryId});
  if(input.filter && input.filter!=="ALL")params.set("filter",input.filter);
  return "/api/courses/faculty/reports/" + input.kind +
    "/" + encodeURIComponent(input.assessmentId) + "/csv?" +
    params.toString();
}

/**
 * Enforce one and only one Section selector. Converting URLSearchParams to an
 * object silently drops duplicate keys (and hides injected audience fields).
 */
export function parseFacultyCsvDownloadUrl(url: string, rawParams: unknown) {
  const params=new URL(url).searchParams;
  const entries=[...params.entries()];
  const deliveries=params.getAll("deliveryId");
  const filters=params.getAll("filter");
  if(deliveries.length!==1 || filters.length>1 ||
    entries.some(([key])=>key!=="deliveryId"&&key!=="filter") ||
    entries.length!==1+filters.length) {
    return facultyReportCsvRequestSchema.parse({
      ...rawParams as Record<string,unknown>,deliveryId:null,
    });
  }
  return facultyReportCsvRequestSchema.parse({
    ...rawParams as Record<string,unknown>,
    deliveryId:deliveries[0],
    ...(filters.length?{filter:filters[0]}:{}),
  });
}

export function facultyCsvAttachmentHeaders(filename: string) {
  // Filename is produced by our slugger, not by a request header.
  if (!/^faculty-(assignment|quiz)-report-[a-z0-9-]+\.csv$/.test(filename)) {
    throw new Error("INVALID_CSV_FILENAME");
  }
  return {
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="' + filename + '"',
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff",
  };
}
