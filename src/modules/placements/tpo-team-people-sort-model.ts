export type TpoPeopleSort="WORK"|"OVERDUE"|"NAME";
/** Only persisted drive-day duties are counted; open asks are not inferred. */
export function sortTpoPeople<T extends {
 membershipId:string;displayName:string|null;
 studentDuties:readonly unknown[];openAsks?:number;overdueAsks?:number;
}>(members:readonly T[],sort:TpoPeopleSort="WORK"):T[]{
 return [...members].sort((a,b)=>{
  if(sort==="OVERDUE"){
   const difference=(b.overdueAsks??0)-(a.overdueAsks??0);
   if(difference)return difference;
  }
  if(sort==="WORK"||sort==="OVERDUE"){
   const difference=(b.studentDuties.length+(b.openAsks??0))-
    (a.studentDuties.length+(a.openAsks??0));
   if(difference)return difference;
  }
  return (a.displayName??"").localeCompare(b.displayName??"","en")||
    a.membershipId.localeCompare(b.membershipId);
 });
}
