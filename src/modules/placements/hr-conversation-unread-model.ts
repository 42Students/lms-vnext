export function summarizeRecruiterUnread(rows:readonly {unread:number}[]) {
 return rows.reduce((total,row)=>total+Math.max(0,row.unread),0);
}
