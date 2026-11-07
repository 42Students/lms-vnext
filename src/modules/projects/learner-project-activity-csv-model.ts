/** Export only the already authorized, filtered activity page, never all historical events. */
const MAX_ROWS=100,MAX_CELL=240;
function csvCell(value:string):string {
 // Truncate at Unicode code-point boundaries: do not break emoji or Indian scripts.\n const shortened=Array.from(value).slice(0,MAX_CELL).join("");
 const guarded=/^[\p{Cc}\p{Cf}\p{M}\p{Zs}\p{Zl}\p{Zp}]*[=+@\-]/u.test(shortened)?"'"+shortened:shortened;
 return '"'+guarded.replaceAll('"','""')+'"';
}
export function learnerProjectActivityCsv(rows:readonly {
 occurredAt:Date;actorDisplayName:string|null;summary:string;subjectLabel:string|null;
}[]):{content:string;truncated:boolean} {
 const selection=rows.slice(0,MAX_ROWS);
 const data=selection.map(row=>[
  Number.isFinite(row.occurredAt?.getTime())?row.occurredAt.toISOString():"Unknown",
  row.actorDisplayName??"System",row.subjectLabel??"",row.summary,
 ].map(csvCell).join(","));
 return {content:"\uFEFF"+["UTC time,Actor,Subject,Summary",...data].join("\r\n")+"\r\n",
   truncated:rows.length>MAX_ROWS};
}
