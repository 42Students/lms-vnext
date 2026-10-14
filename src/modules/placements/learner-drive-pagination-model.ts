/** Client page state for already authorized, locally filtered role rows. */
export function learnerDrivePageState(count:number,requested:number,pageSize=20){
 const safeSize=Number.isInteger(pageSize)&&pageSize>0?pageSize:20;
 const safeCount=Math.max(0,Math.trunc(Number.isFinite(count)?count:0));
 const totalPages=Math.max(1,Math.ceil(safeCount/safeSize));
 const requestedPage=Number.isInteger(requested)&&requested>0?requested:1;
 const page=Math.min(requestedPage,totalPages);
 const startIndex=(page-1)*safeSize;
 const endIndex=Math.min(startIndex+safeSize,safeCount);
 return {page,totalPages,startIndex,endIndex,
   firstNumber:safeCount===0?0:startIndex+1,lastNumber:endIndex,
   recovered:requestedPage!==page};
}
