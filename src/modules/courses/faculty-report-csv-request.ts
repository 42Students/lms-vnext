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
