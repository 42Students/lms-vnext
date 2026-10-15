/** Platform account status is independent of a user's persisted college membership. */
export function canAccessAnnouncements(platformStatus:string):boolean{
 return platformStatus==="ACTIVE";
}
