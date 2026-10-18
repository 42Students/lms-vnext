import {z} from "zod";

const decimal=(min:number,max:number,fallback:number)=>z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(min).max(max)),
]).default(fallback);

const schema=z.strictObject({
  fromMentorId:z.union([z.string().uuid(),z.literal("UNASSIGNED")]).optional(),
  projectId:z.string().uuid().optional(),
  mentorSearch:z.string().trim().max(100).default(""),
  q:z.string().trim().max(120).optional(),
  status:z.enum(["PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
  page:decimal(1,10000,1),
  pageSize:decimal(10,100,25),
});

/** A guessed mentor/project UUID is never enough to read project records.
 * Reject duplicates, unknown keys and ambiguous numbers before loading data.
 */
export function parseProjectAdminReassignMentorQuery(
  params:Record<string,string|string[]|undefined>,
){
  if(Object.values(params).some(Array.isArray)||Object.keys(params).some(key=>
    !["fromMentorId","projectId","mentorSearch","q","status","page","pageSize"].includes(key)))
    return schema.safeParse(null);
  const entries=Object.fromEntries(Object.entries(params).filter(([key,value])=>
    value!==undefined&&(value!==""||key==="page"||key==="pageSize")));
  return schema.safeParse(entries);
}
