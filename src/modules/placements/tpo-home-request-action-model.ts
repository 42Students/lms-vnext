export function pendingTpoRequestsAction(count:number):{href:string;label:string}|null{
 if(!Number.isSafeInteger(count)||count<=0)return null;
 return {href:"/tpo/requests",label:count+" pending placement request"+(count===1?"":"s")};
}
