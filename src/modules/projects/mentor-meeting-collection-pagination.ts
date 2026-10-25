/** Strict, bounded page parsing for the authenticated project meetings API.
 * This parser lives outside the route so runtime tests exercise the actual
 * regex (not source text) and do not import Next.js server context.
 */
export type MentorMeetingCollectionPagination =
  | {valid:true;page:number|null;pageSize:number|null}
  | {valid:false};

export function parseMentorMeetingCollectionPagination(
  search:URLSearchParams,
):MentorMeetingCollectionPagination{
  const rawPage=search.get("page");
  const rawSize=search.get("pageSize");
  if(search.getAll("page").length>1||search.getAll("pageSize").length>1)
    return {valid:false};
  // Multi-digit decimal values are valid; zero, a sign, exponent, whitespace
  // and leading zeros are not. Keep the historic 99-row/99999-page limits.
  if((rawPage!==null&&!/^[1-9]\d{0,4}$/.test(rawPage))||
     (rawSize!==null&&(!/^[1-9]\d{0,2}$/.test(rawSize)||
       Number(rawSize)>99)))
    return {valid:false};
  return {valid:true,page:rawPage===null?null:Number(rawPage),
    pageSize:rawSize===null?null:Number(rawSize)};
}
