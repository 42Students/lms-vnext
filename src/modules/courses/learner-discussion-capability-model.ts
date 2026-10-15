/** A route reply must explicitly grant create permission before the
 * client can expose a submission action; absent or failed reads fail closed. */
export function learnerDiscussionCanPost(value:unknown):boolean{
 return value===true;
}
