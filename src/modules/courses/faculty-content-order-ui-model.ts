/** Reorder exactly one position, preserving IDs and leaving boundaries unchanged. */
export function facultyMoveContentId(ids:readonly string[],from:number,delta:number):string[]{
 if(!Number.isInteger(from)||(delta!==-1&&delta!==1))return [...ids];
 const to=from+delta;
 if(from<0||from>=ids.length||to<0||to>=ids.length)return [...ids];
 const result=[...ids];
 [result[from],result[to]]=[result[to]!,result[from]!];
 return result;
}

/** Saving a persisted order without any changes should not send another write. */
export function facultyContentOrderDirty(initial:readonly string[],draft:readonly string[]):boolean{
 return initial.length!==draft.length || initial.some((id,i)=>id!==draft[i]);
}

/** Reset only to the latest server-provided order, not an old local snapshot. */
export function facultyResetContentOrder<T extends {id:string}>(items:readonly T[]):string[]{
 return items.map(item=>item.id);
}
