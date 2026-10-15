export const TPO_BULK_UI_LIMIT=25;
export type TpoBulkUiRow={id:string;label:string};
export function toggleTpoBulkRow(ids:readonly string[],id:string,checked:boolean){
 if(!checked)return ids.filter(existing=>existing!==id);
 if(ids.includes(id)||ids.length>=TPO_BULK_UI_LIMIT)return [...ids];
 return [...ids,id];
}
export function selectTpoBulkPage(ids:readonly string[]){
 return Array.from(new Set(ids)).slice(0,TPO_BULK_UI_LIMIT);
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
