export function messagingHistoryPageWindow(page:number,total:number,pageSize:number){
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(total)||total<0||
    !Number.isSafeInteger(pageSize)||pageSize<1)throw new Error("INVALID_HISTORY_WINDOW");
 const pages=Math.max(1,Math.ceil(total/pageSize));
 const current=Math.min(page,pages);
 return {page:current,pages,offset:(current-1)*pageSize};
}
