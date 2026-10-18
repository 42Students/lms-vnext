/** Counts are restricted to the fetched, authorized history page; never claim a global total. */
export function learnerProjectActivityPageSummary(shown:number,pageRows:number,searching:boolean):string {
 const total=Number.isFinite(pageRows)?Math.max(0,Math.trunc(pageRows)):0;
 const matching=Number.isFinite(shown)?Math.max(0,Math.min(total,Math.trunc(shown))):0;
 return searching ? `${matching} of ${total} events match on this loaded page` : `${total} events on this loaded page`;
}
