/** TPO-batches-65: keyboard shortcuts are confined to the active, visible
 * 25-row batch list; never claim that Ctrl+A selected unseen learners. */
export type TpoBatchShortcut="SELECT_VISIBLE"|"COPY_SELECTED"|null;
export function tpoBatchShortcut(input:{
 key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;shiftKey:boolean;
 insideEditable:boolean;
}):TpoBatchShortcut{
 if(input.insideEditable||input.altKey||input.shiftKey||!(input.ctrlKey||input.metaKey))return null;
 if(input.key.toLowerCase()==="a")return "SELECT_VISIBLE";
 if(input.key.toLowerCase()==="c")return "COPY_SELECTED";
 return null;
}
export function tpoBatchVisibleSelection<T extends {id:string}>(rows:readonly T[],selected:readonly string[]):string[]{
 const allowed=new Set(rows.map(row=>row.id));
 return [...new Set(selected)].filter(id=>allowed.has(id)).slice(0,25);
}
export function tpoBatchSelectedClipboard(
 rows:readonly {id:string;name:string;rollNumber?:string|null}[],selected:readonly string[],
):string{
 const ids=new Set(tpoBatchVisibleSelection(rows,selected));
 return rows.filter(row=>ids.has(row.id)).map(row=>
  row.name.replace(/[\t\r\n]/g," ")+"\t"+(row.rollNumber??"").replace(/[\t\r\n]/g," ")).join("\n");
}
