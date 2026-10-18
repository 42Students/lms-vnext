/** A company's private recruiter-lead timeline may span more than one SQL
 * parameter batch. Show the newest 200 globally, not the first 200 returned
 * by an arbitrary lead-ID chunk. Preserve stable date/ID tie ordering. */
export function latestTpoCompanyLeadActivities<T extends {id:string;createdAt:Date}>(
 batches:readonly (readonly T[])[],limit=200,
):T[]{
 if(!Number.isSafeInteger(limit)||limit<1||limit>200)
  throw new RangeError("Company timeline page must contain 1–200 activities");
 return batches.flat().sort((a,b)=>
  b.createdAt.getTime()-a.createdAt.getTime()||b.id.localeCompare(a.id)).slice(0,limit);
}
