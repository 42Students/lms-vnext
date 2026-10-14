import { z } from "zod";
export const templateMetadataEditSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(2000).default("").transform(value => value || null),
  changeNote: z.string().trim().min(1).max(1000),
  expectedCurrentVersion: z.number().int().min(1).max(2147483646),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});
export type TemplateMetadataEditInput = z.output<typeof templateMetadataEditSchema>;
export function templateMetadataEditDecision(row: {
  currentVersion: number; status: string; title: string; summary: string | null;
}, input: TemplateMetadataEditInput, timestampMatches: boolean) {
  if (!timestampMatches || row.currentVersion !== input.expectedCurrentVersion) return "PROJECT_TEMPLATE_STALE_VERSION";
  if (row.status !== "DRAFT") return "PROJECT_TEMPLATE_INVALID_STATE";
  if (row.title === input.title && row.summary === input.summary) return "PROJECT_TEMPLATE_UNCHANGED";
  return null;
}
