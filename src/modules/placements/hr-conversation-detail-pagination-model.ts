export function hrConversationDetailPageWindow(requestedPage:number,total:number){
 const safeTotal=Number.isSafeInteger(total)&&total>=0?total:0;
 const pages=Math.max(1,Math.ceil(safeTotal/40));
 const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(requestedPage,pages)):1;
 return {page,pages,offset:(page-1)*40};
}
