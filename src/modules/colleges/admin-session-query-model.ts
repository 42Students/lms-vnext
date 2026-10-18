import {z} from "zod";

/** Tenant administrator history is read-only but scoped and must reject
 * unexpected query controls or ambiguous duplicate page parameters. */
const historyParams=z.strictObject({
  page:z.union([
    z.number().int().min(1).max(10000),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(10000)),
  ]).default(1),
});
export function parseAdminSessionHistoryPage(raw:Record<string,string|string[]|undefined>):number|null{
  if(Object.values(raw).some(Array.isArray))return null;
  const parsed=historyParams.safeParse(Object.fromEntries(
    Object.entries(raw).filter(([,v])=>v!==undefined&&v!=="")));
  return parsed.success?parsed.data.page:null;
}
