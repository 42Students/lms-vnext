/** A cautious, display-only summary of the first sheet extracted by the
 * existing bounded XLSX parser. No formulas are evaluated or trial outcomes
 * guessed from arbitrary spreadsheet column names. */
export type MentorXlsxTrialSummary={
 headers:string[];rows:string[][];totalDataRows:number;
 numericTotals:{header:string;total:number;count:number}[];
};
export function mentorCsvRows(csv:string,maxRows=5001):string[][]{
 if(csv.length>3_000_000)throw new Error("XLSX_PREVIEW_TOO_LARGE");
 const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
 for(let i=0;i<csv.length;i++){
  const char=csv[i];
  if(quoted){
   if(char==='"'&&csv[i+1]==='"'){field+='"';i++;}
   else if(char==='"')quoted=false;
   else field+=char;
  }else if(char==='"'&&field===""){quoted=true;}
  else if(char===","){row.push(field);field="";}
  else if(char==="\n"){
   row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";
   if(rows.length>maxRows)throw new Error("XLSX_PREVIEW_TOO_MANY_ROWS");
  }else field+=char;
 }
 if(quoted)throw new Error("XLSX_PREVIEW_INVALID_CSV");
 if(field||row.length){row.push(field);rows.push(row);}
 // A file lacking a trailing newline must obey the same row limit.
 if(rows.length>maxRows)throw new Error("XLSX_PREVIEW_TOO_MANY_ROWS");
 return rows.filter(row=>row.some(value=>value.trim()));
}
export function mentorXlsxTrialSummary(csv:string):MentorXlsxTrialSummary{
 const rows=mentorCsvRows(csv),headers=(rows[0]??[]).slice(0,30)
  .map((value,index)=>value.trim().slice(0,80)||"Column "+(index+1));
 const data=rows.slice(1);
 const numericTotals=headers.flatMap((header,index)=>{
  let count=0,total=0;
  for(const row of data){
   const value=(row[index]??"").trim();
   if(!/^-?(?:\d{1,12}(?:\.\d{1,6})?|\.\d{1,6})$/.test(value))continue;
   const parsed=Number(value);if(!Number.isFinite(parsed))continue;
   count++;total+=parsed;
  }
  return count===data.length&&count>0&&Number.isFinite(total)?
   [{header,total:Math.round(total*100)/100,count}]:[];
 });
 return {headers,rows:data.slice(0,12).map(row=>headers.map((_,i)=>
   (row[i]??"").slice(0,240))),totalDataRows:data.length,numericTotals};
}
