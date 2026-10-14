/** Old generic results route is for Admin only; Faculty must use the
 * scoped, confirmed optimistic action. */
export function legacyQuizResultsWriteAllowed(canManage:boolean,status:string,
 currentPublished:boolean,nextPublished:boolean){
 return canManage&&status==="CLOSED"&&currentPublished!==nextPublished;
}
