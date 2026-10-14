import { z } from "zod";

export const facultyReportCsvRequestSchema = z.object({
  kind: z.enum(["assignment","quiz"]),
  assessmentId: z.string().uuid(),
  deliveryId: z.string().uuid(),
}).strict();

export function facultyReportCsvHref(raw: unknown) {
  const input = facultyReportCsvRequestSchema.parse(raw);
  return "/api/courses/faculty/reports/" + input.kind +
    "/" + encodeURIComponent(input.assessmentId) + "/csv?deliveryId=" +
    encodeURIComponent(input.deliveryId);
}

/**
 * Enforce one and only one Section selector. Converting URLSearchParams to an
 * object silently drops duplicate keys (and hides injected audience fields).
 */
export function parseFacultyCsvDownloadUrl(url: string, rawParams: unknown) {
  const parsedUrl = new URL(url);
  const entries = [...parsedUrl.searchParams.entries()];
  if (entries.length !== 1 ||
      entries[0]?.[0] !== "deliveryId" ||
      parsedUrl.searchParams.getAll("deliveryId").length !== 1) {
    return facultyReportCsvRequestSchema.parse({
      ...rawParams as Record<string,unknown>,
      deliveryId: null,
    });
  }
  return facultyReportCsvRequestSchema.parse({
    ...rawParams as Record<string,unknown>,
    deliveryId:entries[0][1],
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
