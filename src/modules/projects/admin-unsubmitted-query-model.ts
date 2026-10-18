import {z} from "zod";

/** Scoped Super Admin 'not submitted' directory, never an unbounded export. */
export const adminUnsubmittedQuerySchema=z.strictObject({
 q:z.string().trim().max(120).optional(),
 page:z.coerce.number().int().min(1).max(100000).default(1),
 pageSize:z.coerce.number().int().min(10).max(100).default(25),
});

/** PostgreSQL ILIKE must match literal user text, not user-supplied wildcard patterns. */
export function adminUnsubmittedLiteralSearchPattern(raw:string){
 return "%"+raw.replace(/[\\%_]/g,char=>"\\"+char)+"%";
}
