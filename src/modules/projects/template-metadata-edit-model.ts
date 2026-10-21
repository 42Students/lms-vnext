import { z } from "zod";
export const templateMetadataEditSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(2000).default("").transform(value => value || null),
  changeNote: z.string().trim().min(1).max(1000),
  slug:z.string().trim().min(1,"Template slug is required").max(80,"Template slug must be 80 characters or fewer").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Use lowercase letters, numbers and single hyphens").optional(),
  courseLabel:z.string().trim().max(160).optional(),
  phase:z.string().trim().max(80).optional(),
  overview:z.strictObject({
    goal:z.string().trim().max(2000).optional(),
    description:z.string().trim().max(4000).optional(),
    deliverables:z.array(z.string().trim().min(1).max(500)).max(50).optional(),
    definitionOfDone:z.array(z.string().trim().min(1).max(500)).max(50).optional(),
    personas:z.array(z.string().trim().min(1).max(500)).max(50).optional(),
    submissionInstructions:z.string().trim().max(4000).optional(),
  }).optional(),
  expectedCurrentVersion: z.number().int().min(1).max(2147483646),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});
export type TemplateMetadataEditInput = z.output<typeof templateMetadataEditSchema>;
export function templateMetadataEditDecision(row: {
  currentVersion: number; status: string; title: string; summary: string | null;
}, input: TemplateMetadataEditInput, timestampMatches: boolean) {
  if (!timestampMatches || row.currentVersion !== input.expectedCurrentVersion) return "PROJECT_TEMPLATE_STALE_VERSION";
  if (row.status !== "DRAFT") return "PROJECT_TEMPLATE_INVALID_STATE";
  if (row.title === input.title && row.summary === input.summary &&
     input.slug===undefined&&input.courseLabel===undefined&&input.phase===undefined&&input.overview===undefined)
     return "PROJECT_TEMPLATE_UNCHANGED";
  return null;
}
