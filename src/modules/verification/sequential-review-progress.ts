/** COL-verification-misc-03: session progress is per queued request, not entire filtered college. */
export function verificationSessionProgress(index:number,total:number){
 const safeTotal=Math.max(0,Math.floor(total));
 const visited=Math.min(safeTotal,Math.max(0,Math.floor(index)+1));
 return `${visited} of ${safeTotal}`;
}
export function verificationSessionStopped(index:number,total:number){
 const safeTotal=Math.max(0,Math.floor(total));
 const visited=Math.min(safeTotal,Math.max(0,Math.floor(index)+1));
 const remaining=safeTotal-visited;
 return `Stopped at ${visited} of ${safeTotal}. The other ${remaining} ${remaining===1?"is":"are"} still in the queue.`;
}
export function verificationSessionFinished(total:number){
 return `Finished reviewing ${Math.max(0,total)} request(s) in this session.`;
}
