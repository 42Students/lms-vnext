function cell(value:string):string{
 const safe=/^[\s\uFEFF]*[=+@\-\t\r]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export type TpoCohortHistoryCsvRow={id:string;kind:string;before:string|null;after:string|null;actionId:string;reversesActionId:string|null;occurredAt:Date;scopeType?:string;scopeId?:string;actorName?:string|null;beforeReason?:string|null;afterReason?:string|null};
export function serializeTpoCohortHistoryCsv(rows:readonly TpoCohortHistoryCsvRow[]):string{
 const matrix=[["Event ID","Type","Before","After","Action ID","Reverses action ID","Recorded at UTC","Scope type","Scope ID","Changed by","Reason"],
 ...rows.map(row=>[row.id,row.kind,row.before??"NOT_DECIDED",row.after??"NOT_DECIDED",row.actionId,row.reversesActionId??"",row.occurredAt.toISOString(),row.scopeType??"",row.scopeId??"",row.actorName??"",row.afterReason??row.beforeReason??""])];
 return matrix.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
export function tpoCohortHistoryCsvHref(batchId:string,filters:{kind:string;after:string}){
 const p=new URLSearchParams();
 if(filters.kind!=="ALL")p.set("kind",filters.kind);
 if(filters.after!=="ALL")p.set("after",filters.after);
 return "/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/history/export"+(p.size?"?"+p.toString():"");
}
