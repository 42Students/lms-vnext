export const VERIFICATION_PAGE_SIZE=25;
export function verificationPage<T>(rows:readonly T[],page:number){
 if(!Number.isSafeInteger(page)||page<1||page>10000) throw Error("INVALID_PAGE");
 const start=(page-1)*VERIFICATION_PAGE_SIZE;
 return {rows:rows.slice(start,start+VERIFICATION_PAGE_SIZE),total:rows.length,
 page,totalPages:Math.ceil(rows.length/VERIFICATION_PAGE_SIZE),
 hasMore:start+VERIFICATION_PAGE_SIZE<rows.length};
}
