/** Do not claim a page is stale when a focused notice intentionally relocated it. */
export function learnerNoticePageWasClamped(requested:number,actual:number,total:number,focusFound:boolean){
 return Number.isSafeInteger(requested)&&requested>actual&&total>0&&!focusFound;
}
