/** Excel-compatible CSV import. Only exact eligible UUIDs may be selected;
 * neither uploaded names nor arbitrary source URLs grant applicant access. */
export function recruiterSelectionCsvTemplate(rows:readonly {id:string;name:string}[]):string{
 const cell=(value:string)=>'"'+value.replace(/[\x00-\x1f\x7f]/g," ").replace(/"/g,'""')+'"';
 return ["application_id,name",...rows.slice(0,200).map(row=>
  [cell(row.id),cell(/^[\\s\\ufeff]*[=+@-]/.test(row.name)?"'"+row.name:row.name)].join(","))].join("\r\n")+"\r\n";
}
export function parseRecruiterSelectionCsv(
 content:string,allowed:ReadonlySet<string>,
):{ok:true;ids:string[]}|{ok:false;error:string}{
 if(content.length>65536)return {ok:false,error:"File exceeds 64 KB. Select up to 200 applicants."};
 const records:string[][]=[];let row:string[]=[],field="",quoted=false,closed=false;
 const finishField=()=>{row.push(field);field="";closed=false;};
 const finishRow=()=>{finishField();if(row.some(value=>value.trim()))records.push(row);row=[];};
 for(let i=0;i<content.length;i++){
  const ch=content[i]!;
  if(quoted){
   if(ch==='"'&&content[i+1]==='"'){field+='"';i++;}
   else if(ch==='"'){quoted=false;closed=true;}
   else field+=ch;
  }else if(ch==='"'){
   if(field!==""||closed)return {ok:false,error:"Invalid CSV quoting."};
   quoted=true;
  }else if(ch===","){finishField();}
  else if(ch==="\n"){finishRow();if(records.length>201)
    return {ok:false,error:"Select at most 200 applicants."};}
  else if(ch==="\r"){if(content[i+1]!=="\n")finishRow();}
  else if(closed&&ch!==" "){return {ok:false,error:"Invalid CSV quoting."};}
  else field+=ch;
 }
 if(quoted)return {ok:false,error:"Unclosed CSV quoted value."};
 if(field||row.length)finishRow();
 const header=records.shift()?.map(value=>value.trim().toLowerCase().replace(/^\ufeff/,""));
 if(!header||header[0]!=="application_id"||
  header.some((name,index)=>index>0&&name!=="name"))
  return {ok:false,error:"Use the template with application_id as the first column."};
 if(!records.length||records.length>200)
  return {ok:false,error:"Import between 1 and 200 applicant rows."};
 const picked:string[]=[];const seen=new Set<string>();
 for(const fields of records){
  if(fields.length>2||!fields[0]||!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(fields[0].trim()))
   return {ok:false,error:"One or more application IDs are invalid."};
  const id=fields[0].trim().toLowerCase();
  if(!allowed.has(id))return {ok:false,error:"One or more applicants are not eligible for this drive."};
  if(!seen.has(id)){seen.add(id);picked.push(id);}
 }
 return picked.length?{ok:true,ids:picked}:{ok:false,error:"No applicants selected."};
}
