import { z } from "zod";
export const TEMPLATE_VERSION_HISTORY_PAGE_SIZE = 25;
export const templateVersionHistoryQuerySchema = z.strictObject({
  page: z.union([
  z.number().int().min(1).max(1000),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(1).max(1000)),
]).default(1),
});
export function templateVersionHistoryPage(total: number, requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(total / TEMPLATE_VERSION_HISTORY_PAGE_SIZE));
  const page = Math.min(templateVersionHistoryQuerySchema.parse({ page: requestedPage }).page, totalPages);
  return { total, totalPages, page, offset: (page - 1) * TEMPLATE_VERSION_HISTORY_PAGE_SIZE };
}
export function templateVersionHistoryHref(templateId: string, page: number) {
  const id = z.uuid().parse(templateId);
  const query = templateVersionHistoryQuerySchema.parse({ page });
  return `/admin/projects/templates/${id}/versions` + (query.page > 1 ? `?page=${query.page}` : "");
}
