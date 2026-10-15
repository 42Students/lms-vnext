/** Client-local slicing of an already-owned application result set. */
export function learnerApplicationPage(total:number,requested:number,pageSize:number){
 if(!Number.isSafeInteger(total)||total<0||!Number.isSafeInteger(pageSize)||pageSize<1)
  throw new Error("INVALID_APPLICATION_PAGE");
 const pages=Math.max(1,Math.ceil(total/pageSize));
 const page=Number.isSafeInteger(requested)?Math.max(1,Math.min(requested,pages)):1;
 return {page,pages,start:(page-1)*pageSize,end:Math.min(total,page*pageSize),corrected:page!==requested};
}
