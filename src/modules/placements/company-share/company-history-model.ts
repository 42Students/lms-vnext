/** Merge per-job-batch history without turning a 100-row page into
 * arbitrary results from the first PostgreSQL IN predicate. */
export function latestCompanyShareRows<T extends {id:string;createdAt:Date}>(
 rows:readonly T[],max=100,
):T[]{
 if(!Number.isSafeInteger(max)||max<1||max>100)
  throw new RangeError("Company history page must contain 1–100 rows");
 return [...rows].sort((a,b)=>
  b.createdAt.getTime()-a.createdAt.getTime()||b.id.localeCompare(a.id)).slice(0,max);
}
