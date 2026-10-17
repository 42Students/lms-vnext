export type TpoPeopleSort="WORK"|"NAME";
/** Only persisted drive-day duties are counted; open asks are not inferred. */
export function sortTpoPeople<T extends {
 membershipId:string;displayName:string|null;
 studentDuties:readonly unknown[];
}>(members:readonly T[],sort:TpoPeopleSort="WORK"):T[]{
 return [...members].sort((a,b)=>{
  if(sort==="WORK"){
   const difference=b.studentDuties.length-a.studentDuties.length;
   if(difference)return difference;
  }
  return (a.displayName??"").localeCompare(b.displayName??"","en")||
    a.membershipId.localeCompare(b.membershipId);
 });
}
