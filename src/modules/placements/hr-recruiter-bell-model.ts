export type HrBellNotification={id:string;label:string;title?:string;unread:boolean;at:string;href:string};
export type HrBellResponse={status:string;unread:number;hiddenUnread:number;items:HrBellNotification[]};
export function relativeHrBellTime(at:string,now:number):string{
 const time=new Date(at).getTime();
 if(!Number.isFinite(time))return "Recently";
 const minutes=Math.max(0,Math.floor((now-time)/60000));
 if(minutes<1)return "Just now";
 if(minutes<60)return minutes+"m ago";
 if(minutes<1440)return Math.floor(minutes/60)+"h ago";
 return Math.floor(minutes/1440)+"d ago";
}
export const HR_BELL_EMPTY="Nothing yet";
export const HR_BELL_EMPTY_HELP="Replies and drive decisions will show up here.";

/** Synchronous single-flight guard: two clicks before a React rerender
 * cannot send two read-receipt mutations for the same recruiter bell. */
export function createHrBellMutationGate(){
 let inFlight=false;
 return {
  tryBegin():boolean{
   if(inFlight)return false;
   inFlight=true;
   return true;
  },
  end():void{inFlight=false;},
 };
}

/** Treat JSON returned to a persistent notification bell as untrusted.
 * Never navigate to a URL other than a recruiter-scoped hiring job.
 * 40 visible rows match the old drawer; the hidden unread counter does not
 * authorize marking notifications outside the list as read. */
export function parseHrBellResponse(raw:unknown):HrBellResponse|null{
 if(!raw||typeof raw!=="object")return null;
 const candidate=raw as Record<string,unknown>;
 const status=candidate.status;
 if(status!=="READY"&&status!=="CHOOSE_COLLEGE"&&status!=="NO_ACCESS")return null;
 if(typeof candidate.unread!=="number"||!Number.isSafeInteger(candidate.unread)||
    candidate.unread<0||!Array.isArray(candidate.items)||candidate.items.length>40)return null;
 const items:HrBellNotification[]=[];
 for(const unknownItem of candidate.items){
  if(!unknownItem||typeof unknownItem!=="object")return null;
  const item=unknownItem as Record<string,unknown>;
  if(typeof item.id!=="string"||typeof item.label!=="string"||
     typeof item.at!=="string"||typeof item.href!=="string"||
     typeof item.unread!=="boolean"||item.label.length>500||
     !Number.isFinite(Date.parse(item.at))||
     !/^\/hr\/placements\/jobs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\?tab=(?:overview|applicants|rounds|offers|requests|discussion))?$/i.test(item.href)){
   return null;
  }
  if(item.title!==undefined&&(typeof item.title!=="string"||item.title.length>300))return null;
  items.push({id:item.id,label:item.label,title:typeof item.title==="string"?item.title:undefined,
    unread:item.unread,at:item.at,href:item.href});
 }
 const hiddenUnread = candidate.hiddenUnread === undefined
  ? Math.max(0,candidate.unread-items.filter(item=>item.unread).length)
  : candidate.hiddenUnread;
 if(typeof hiddenUnread!=="number"||!Number.isSafeInteger(hiddenUnread)||hiddenUnread<0||
   hiddenUnread>candidate.unread)return null;
 if(status!=="READY"&&(items.length!==0||candidate.unread!==0||hiddenUnread!==0))return null;
 return {status,unread:candidate.unread,hiddenUnread,items};
}
