/** Avoid 100 sequential report DB round trips without flooding the pool. */
export async function mapFacultyGradebookReportBatch<T,U>(
 inputs:readonly T[],fetch:(item:T)=>Promise<U>,concurrency=6,
):Promise<U[]>{
 if(!Number.isSafeInteger(concurrency)||concurrency<1||concurrency>6)
  throw new RangeError("INVALID_FACULTY_GRADEBOOK_CONCURRENCY");
 const result:U[]=[];
 for(let start=0;start<inputs.length;start+=concurrency){
  const rows=await Promise.all(inputs.slice(start,start+concurrency).map(fetch));
  result.push(...rows);
 }
 return result;
}
