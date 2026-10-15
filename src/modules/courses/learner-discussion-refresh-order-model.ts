/** Concurrent polling/manual refreshes must not roll a newer authorized
 * discussion snapshot backward when an older request resolves last. */
export function learnerDiscussionRefreshIsCurrent(received:number,latest:number):boolean{
 return Number.isSafeInteger(received)&&received>0&&received===latest;
}
