export function summarizeRecruiterUnread(rows:readonly {unread:number}[]) {
 return rows.reduce((total,row)=>{
  // DB counts are nonnegative integers. A damaged cached response must never
  // render NaN, Infinity or an unsafe bell count in the recruiter UI.
  const value=Number.isSafeInteger(row.unread)&&row.unread>0?row.unread:0;
  return Math.min(Number.MAX_SAFE_INTEGER,total+value);
 },0);
}
