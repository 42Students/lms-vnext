/** Limit simultaneous independent course-card IO without changing result
 * order. Individual delivery failures must be handled by the caller. */
export async function mapLearnerCourseCardsLimited<T,R>(
 entries:readonly T[],worker:(entry:T,index:number)=>Promise<R>,
 concurrency=4,
):Promise<R[]>{
 const out=new Array<R>(entries.length);
 let cursor=0;
 // Non-finite caller values must never silently return an empty card list or
 // trigger unbounded parallel reads.
 const parallel=Number.isFinite(concurrency)?Math.max(1,Math.floor(concurrency)):4;
 const slots=Math.min(entries.length,parallel);
 await Promise.all(Array.from({length:slots},async()=>{
  while(cursor<entries.length){
   const index=cursor++;
   out[index]=await worker(entries[index]!,index);
  }
 }));
 return out;
}
