/** Counts are restricted to the fetched, authorized history page; never claim a global total. */
export function learnerProjectActivityPageSummary(shown:number,pageRows:number,searching:boolean):string {
 const total=Math.max(0,Math.trunc(pageRows));
 const matching=Math.max(0,Math.min(total,Math.trunc(shown)));
 return searching ? `${matching} of ${total} events match on this loaded page` : `${total} events on this loaded page`;
}
