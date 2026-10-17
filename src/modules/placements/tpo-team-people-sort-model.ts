export type TpoPeopleSort="WORK"|"OVERDUE"|"NAME";
/** Only persisted drive-day duties are counted; open asks are not inferred. */
export function sortTpoPeople<T extends {
 membershipId:string;displayName:string|null;
 studentDuties:readonly unknown[];openAsks?:number;overdueAsks?:number;
 liveDrives?:number;draftDrives?:number;companies?:number;
 overdueFollowups?:number;waitingOnOthers?:number;
}>(members:readonly T[],sort:TpoPeopleSort="WORK"):T[]{
 return [...members].sort((a,b)=>{
  if(sort==="OVERDUE"){
   const difference=((b.overdueAsks??0)+(b.overdueFollowups??0))-
    ((a.overdueAsks??0)+(a.overdueFollowups??0));
   if(difference)return difference;
  }
  if(sort==="WORK"||sort==="OVERDUE"){
   const work=(m:T)=>(m.liveDrives??0)+(m.draftDrives??0)+
    (m.companies??0)+(m.overdueFollowups??0)+(m.openAsks??0)+
    (m.waitingOnOthers??0)+m.studentDuties.length;
   const difference=work(b)-work(a);
   if(difference)return difference;
  }
  return (a.displayName??"").localeCompare(b.displayName??"","en")||
    a.membershipId.localeCompare(b.membershipId);
 });
}
