export type BatchHistory={id:string;membershipId:string;afterVersion:string;occurredAt:string;revertedAt:string|null};
export function undoableBatchHistory(rows:readonly BatchHistory[],current:ReadonlyMap<string,string>){return rows.filter(r=>r.revertedAt===null&&current.get(r.membershipId)===r.afterVersion);}
export function orderBatchHistory(rows:readonly BatchHistory[]){return [...rows].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||b.id.localeCompare(a.id));}
