type StudentRuleHistoryExportRow={module:string;change:string;actorName:string;occurredAt:Date};
/** Formula-neutralized, bounded, already-authorized audit projection only. */
export function studentRuleHistoryCsv(items:readonly StudentRuleHistoryExportRow[]):string {
 const cell=(value:string)=>{
  const flattened=value.replace(/[\\r\\n]/g," ");
  const guarded=/^\\s*[=+\\-@]/.test(flattened)?"'"+flattened:flattened;
  return '"'+guarded.replaceAll('"','""')+'"';
 };
 return ["Occurred at (UTC),Module,Change,Actor",
  ...items.slice(0,40).map(item=>[item.occurredAt.toISOString(),item.module,item.change,item.actorName].map(cell).join(","))].join("\\r\\n")+"\\r\\n";
}
