import { z } from "zod";
export const TEMPLATE_VERSION_HISTORY_PAGE_SIZE = 25;
export const templateVersionHistoryQuerySchema = z.strictObject({
  page: z.union([
  z.number().int().min(1).max(1000),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(1).max(1000)),
]).default(1),
});
/** Legacy version history links used page=0 for their first page and a fixed
 * size of 25. Canonical vNext links remain 1-based. Explicit legacyPage is
 * zero-based at any index; bare page=0 is accepted as the first page.
 * Never silently coerce invalid, repeated or oversized query values.
 */
export function canonicalTemplateVersionHistoryPage(query:{
  page?:string|string[];legacyPage?:string|string[];
}):number|string|string[]|undefined{
  if(query.page!==undefined){
    if(query.page==="0")return 1;
    return query.page;
  }
  if(query.legacyPage===undefined)return undefined;
  if(typeof query.legacyPage!=="string")return query.legacyPage;
  if(!/^(0|[1-9][0-9]{0,2})$/.test(query.legacyPage))return query.legacyPage;
  const zeroBased=Number(query.legacyPage);
  return zeroBased<1000?zeroBased+1:query.legacyPage;
}

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
