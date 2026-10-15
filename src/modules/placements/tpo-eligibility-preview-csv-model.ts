export type TpoPreviewCsvResult={index:number;status:"matched"|"unusable";reason:string|null;membershipId:string|null;expectedVersion:string|null};
export type TpoPreviewCsvSource={studentCode:string;decision:string;reason:string};
function cell(value:string){
 const neutral=/^[\s\uFEFF]*[=+@\-\t\r]/u.test(value)?"'"+value:value;
 return '"'+neutral.replaceAll('"','""')+'"';
}
export function serializeTpoEligibilityPreviewCsv(rows:readonly TpoPreviewCsvSource[],results:readonly TpoPreviewCsvResult[]):string{
 if(rows.length!==results.length)throw new Error("Preview rows do not match the parsed import.");
 const all=[["CSV row","Student UUID","Proposed decision","Preview outcome","Skip reason"]];
 for(let i=0;i<rows.length;i++){
  const src=rows[i],preview=results[i];
  all.push([String(i+2),src.studentCode,src.decision,preview.status,preview.reason??""]);
 }
 return all.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
