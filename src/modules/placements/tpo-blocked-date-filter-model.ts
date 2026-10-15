export function filterTpoBlockedDates<T extends {day:string;reason:string}>(
 dates:readonly T[],search:string,month:string,
):T[]{
 const q=search.trim().toLocaleLowerCase("en-IN");
 return dates.filter(item=>(!month||item.day.startsWith(month+"-"))&&
  (!q||item.reason.toLocaleLowerCase("en-IN").includes(q)||item.day.includes(q)));
}
export function tpoBlockedDatesEmptyMessage(total:number){
 return total===0?"No dates have been blocked.":"No blocked dates match these filters.";
}
