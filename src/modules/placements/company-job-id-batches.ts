/** Bound SQL IN predicates when one company has years of college drives.
 * Preserve the input order but never repeat a relationship-bound job ID. */
export function companyJobIdBatches(ids:readonly string[],size=500):string[][]{
 if(!Number.isSafeInteger(size)||size<1||size>500)
  throw new RangeError("Company job batch size must be 1–500");
 const unique=[...new Set(ids)];
 const result:string[][]=[];
 for(let i=0;i<unique.length;i+=size)result.push(unique.slice(i,i+size));
 return result;
}
