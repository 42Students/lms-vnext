import {z} from "zod";

/** Scoped Super Admin 'not submitted' directory, never an unbounded export. */
/** Reject JS number coercion forms (hex, exponent, whitespace, empty, infinities). */
const positiveDecimal=(min:number,max:number,fallback:number)=>z.union([
 z.number().int().min(min).max(max),
 z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(min).max(max)),
]).default(fallback);
export const adminUnsubmittedQuerySchema=z.strictObject({
 q:z.string().trim().max(120).optional(),
 focusedProjectId: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).optional(),
 status:z.enum(["PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
 page:positiveDecimal(1,100000,1),
 pageSize:positiveDecimal(10,100,25),
});

/** PostgreSQL ILIKE must match literal user text, not user-supplied wildcard patterns. */
export function adminUnsubmittedLiteralSearchPattern(raw:string){
 return "%"+raw.replace(/[\\%_]/g,char=>"\\"+char)+"%";
}
