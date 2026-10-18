export type HrBellNotification={id:string;label:string;unread:boolean;at:string;href:string};
export type HrBellResponse={status:string;unread:number;items:HrBellNotification[]};
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
