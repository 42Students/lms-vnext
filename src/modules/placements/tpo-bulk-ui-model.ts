export const TPO_BULK_UI_LIMIT=200;
export const TPO_BULK_VIEW_LIMIT=5000;
export type TpoBulkUiRow={id:string;label:string};
export function toggleTpoBulkRow(ids:readonly string[],id:string,checked:boolean){
 if(!checked)return ids.filter(existing=>existing!==id);
 if(ids.includes(id)||ids.length>=TPO_BULK_VIEW_LIMIT)return [...ids];
 return [...ids,id];
}
/** Once at capacity, only already checked rows stay enabled for removal. */
export function canSelectTpoBulkRow(selected:readonly string[],id:string) {
 return selected.includes(id)||selected.length<TPO_BULK_VIEW_LIMIT;
}
export function selectTpoBulkPage(ids:readonly string[]){
 return Array.from(new Set(ids)).slice(0,TPO_BULK_VIEW_LIMIT);
}

/** A full-page toggle must check identity, not merely the number selected. */
export function isTpoBulkPageSelected(visible:readonly string[],selected:readonly string[]){
 const page=selectTpoBulkPage(visible);
 return page.length>0&&page.every(id=>selected.includes(id));
}

/** Old previews cannot be confirmed after the displayed roster changes. */
export function isTpoBulkPreviewCurrent(ids:readonly string[],visible:readonly string[]){
 const current=new Set(visible);
 return ids.length>0&&ids.every(id=>current.has(id));
}

/** S1 action-window: the server must supply ALL ids matching the current filters;
 * a page list is never treated as the full view. */
export function canActOnEntireTpoView(viewCount:number,allRows:readonly TpoBulkUiRow[]|undefined){
 return Number.isSafeInteger(viewCount)&&viewCount>0&&viewCount<=TPO_BULK_VIEW_LIMIT
   &&allRows!==undefined&&allRows.length===viewCount
   &&new Set(allRows.map(row=>row.id)).size===allRows.length;
}
