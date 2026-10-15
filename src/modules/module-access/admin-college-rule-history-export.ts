type PolicyAuditRow={at:Date;module:string;change:string;actorName:string};
function field(value:string){
 const flat=value.replace(/[\r\n\t]/g," ");
 const guarded=/^[\s\uFEFF]*[=+\-@]/u.test(flat)?"'"+flat:flat;
 return '"'+guarded.replaceAll('"','""')+'"';
}
/** A maximum of 40 previously scoped, projected audit events may be exported. */
export function collegePolicyHistoryCsv(rows:readonly PolicyAuditRow[]){
 const items=rows.slice(0,40).map(x=>[x.at.toISOString(),x.module,x.change,x.actorName].map(field).join(","));
 return ['"Occurred at (UTC)","Module","Change","Actor"',...items].join("\r\n")+"\r\n";
}
