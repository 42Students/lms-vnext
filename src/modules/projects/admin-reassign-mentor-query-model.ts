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
  mentorPage:decimal(1,1000,1),
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
    !["fromMentorId","projectId","mentorSearch","mentorPage","q","status","page","pageSize"].includes(key)))
    return schema.safeParse(null);
  const entries=Object.fromEntries(Object.entries(params).filter(([key,value])=>
    value!==undefined&&(value!==""||key==="page"||key==="pageSize")));
  return schema.safeParse(entries);
}

/** Retry a failed mentor-management directory without broadening its scope.
 * Every accepted filter is encoded as a separate value, never raw-concatenated.
 */
export function projectAdminReassignMentorHref(
  basePath:string,
  query:z.output<typeof schema>,
):string {
  const params=new URLSearchParams();
  if(query.fromMentorId)params.set("fromMentorId",query.fromMentorId);
  if(query.projectId)params.set("projectId",query.projectId);
  if(query.mentorSearch)params.set("mentorSearch",query.mentorSearch);
  if(query.mentorPage>1)params.set("mentorPage",String(query.mentorPage));
  if(query.q)params.set("q",query.q);
  if(query.status)params.set("status",query.status);
  if(query.page>1)params.set("page",String(query.page));
  if(query.pageSize!==25)params.set("pageSize",String(query.pageSize));
  const suffix=params.toString();
  return basePath+"/reassign-mentor"+(suffix?"?"+suffix:"");
}

/** Historical numeric mentor IDs are a different identity namespace from vNext
 * membership UUIDs. Only a caller-supplied, college-scoped mapping may restore
 * them; an unresolved bookmark must not silently become an unfiltered search.
 */
export async function resolveLegacyReassignMentorBookmark(
 params:Record<string,string|string[]|undefined>,
 lookupInSelectedCollege:(legacyMentorId:number)=>Promise<string|null>,
):Promise<{ok:true;params:Record<string,string|string[]|undefined>}|
 {ok:false;reason:"INVALID_LEGACY_ID"|"LEGACY_MENTOR_NOT_MAPPED"}> {
 const raw=params.fromMentorId;
 if(typeof raw!=="string" || !/^[0-9]+$/.test(raw))
  return {ok:true,params};
 if(!/^[1-9][0-9]{0,14}$/.test(raw)||!Number.isSafeInteger(Number(raw)))
  return {ok:false,reason:"INVALID_LEGACY_ID"};
 const mapped=await lookupInSelectedCollege(Number(raw));
 if(!mapped || !z.string().uuid().safeParse(mapped).success)
  return {ok:false,reason:"LEGACY_MENTOR_NOT_MAPPED"};
 return {ok:true,params:{...params,fromMentorId:mapped}};
}
