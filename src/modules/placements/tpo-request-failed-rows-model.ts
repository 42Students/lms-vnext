/** Clipboard output for failed TPO request bulk decisions is bounded and formula-safe. */
export function tpoRequestFailedRowsTsv(rows:readonly {
 id:string;name:string;status:"updated"|"failed";message:string;
}[]):string{
 const failed=rows.filter(row=>row.status==="failed").slice(0,10);
 if(!failed.length)return "";
 const cell=(value:string)=>{
  const printable=value.replace(/[\t\r\n]+/g," ").replace(/[\x00-\x1f\x7f]/g," ").trim().slice(0,500);
  return /^[=+@\-]/.test(printable)?"'"+printable:printable;
 };
 return ["Student\tRequest ID\tOutcome",
  ...failed.map(row=>[row.name,row.id,row.message].map(cell).join("\t"))].join("\n");
}
