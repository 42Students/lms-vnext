/** Execute independent bulk row writes with bounded pressure on PostgreSQL.
 * Results preserve the caller's selection order even when rows finish out of
 * order. The writer owns row-specific concurrency and conflict handling. */
export async function mapTpoBulkBounded<T,R>(
 items:readonly T[],
 worker:(item:T)=>Promise<R>,
 concurrency=6,
):Promise<R[]>{
 if(!Number.isSafeInteger(concurrency)||concurrency<1||concurrency>10)
  throw new RangeError("Bulk worker concurrency must be 1–10");
 const completed:R[]=[];
 for(let start=0;start<items.length;start+=concurrency){
  const batch=items.slice(start,start+concurrency);
  completed.push(...await Promise.all(batch.map(worker)));
 }
 return completed;
}
