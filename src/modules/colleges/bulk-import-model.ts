import {z} from "zod";
export const MAX_COLLEGE_IMPORT_ROWS=200;
export const collegeImportInputSchema=z.strictObject({organizationId:z.uuid(),csv:z.string().min(1).max(150000)});
export type CollegeImportRow={line:number;name:string;code:string;city:string|null;state:string|null;country:string|null};
/** One organization is selected for each import. This recognizes legacy
 * uniqueId/orgId headings but never guesses a numeric legacy organization ID
 * to a UUID belonging to an unrelated tenant. Split multi-org CSVs by their
 * verified organization mapping before import. */
export const COLLEGE_IMPORT_TEMPLATE="name,code,city,state,country";
export const LEGACY_COLLEGE_IMPORT_TEMPLATE="organizationId,name,uniqueId,city,state";
export function parseCollegeImportCsv(raw:string,selectedOrganizationId?:string):CollegeImportRow[]{
 const records:string[][]=[], source=raw.replace(/^\uFEFF/,"");
 let fields:string[]=[],value="",inside=false,afterQuote=false;
 for(let i=0;i<source.length;i++){
  const char=source[i];
  if(inside){
   if(char==='"'&&source[i+1]==='"'){value+='"';i++;}
   else if(char==='"'){inside=false;afterQuote=true;}
   else value+=char;
  }else if(afterQuote&&char!==","&&char!=="\n"&&char!=="\r"){
   throw Error("Malformed CSV quote");
  }else if(char==='"'&&value.length===0){inside=true;}
  else if(char===","||char==="\n"||char==="\r"){
   fields.push(value.trim());value="";afterQuote=false;
   if(char!==","){
    if(char==="\r"&&source[i+1]==="\n")i++;
    if(fields.some(Boolean))records.push(fields);
    fields=[];
   }
  }else{
   if(char==='"')throw Error("Malformed CSV quote");
   value+=char;
  }
 }
 if(inside)throw Error("Unclosed CSV quote");
 fields.push(value.trim());if(fields.some(Boolean))records.push(fields);
 if(!records.length)throw Error("Paste at least one college.");
 const header=records[0].map(x=>x.toLowerCase().replace(/\s+/g,""));
 const codeHeader=header.includes("code")?"code":"uniqueid";
 const withHeader=header.includes("name")&&header.includes(codeHeader);
 const organizationColumn=header.indexOf("organizationid")>=0?header.indexOf("organizationid"):header.indexOf("orgid");
 const legacyPositional=!withHeader&&records[0].length>=3&&
   (/^\d+$/.test(records[0][0]??"")||z.uuid().safeParse(records[0][0]).success);
 const keys=["name",codeHeader,"city","state","country"];
 const positions=withHeader?keys.map(k=>header.indexOf(k)):
   legacyPositional?[1,2,3,4,-1]:[0,1,2,3,4];
 if(withHeader&&new Set(header).size!==header.length)throw Error("Duplicate CSV heading.");
 const data=withHeader?records.slice(1):records;
 if(data.length===0)throw Error("Paste at least one college.");
 if(data.length>MAX_COLLEGE_IMPORT_ROWS)throw Error("Bulk Import accepts at most 200 colleges.");
 const codes=new Map<string,number>();
 return data.map((row,index)=>{
  const v=(i:number)=>positions[i]<0?"":(row[positions[i]]??"").trim();
  if(legacyPositional&&/^\d+$/.test(row[0]??""))throw Error("Legacy numeric organization IDs cannot establish a vNext tenant. Convert orgId to its verified organization UUID and import each organization separately using organizationId,name,uniqueId,city,state.");
  const sourceOrg=withHeader&&organizationColumn>=0?(row[organizationColumn]??"").trim():legacyPositional?(row[0]??"").trim():"";
  if(sourceOrg){
   if(!z.uuid().safeParse(sourceOrg).success)
    throw Error("Row "+(index+1)+": legacy organization ID needs an explicit UUID mapping; numeric IDs cannot be imported directly.");
   if(selectedOrganizationId&&sourceOrg.toLowerCase()!==selectedOrganizationId.toLowerCase())
    throw Error("Row "+(index+1)+": this college belongs to another organization. Import one organization at a time.");
  }
  const name=v(0),code=v(1);
  if(!name||name.length>255||!code||code.length>64)
   throw Error("Row "+(index+1)+": name and code are required within length limits.");
  if(row.length>(withHeader?header.length:5))throw Error("Row "+(index+1)+": too many columns.");
  const line=index+(withHeader?2:1);
  const previous=codes.get(code.toLowerCase());
  if(previous!==undefined)throw Error("Row "+line+": duplicate college code "+code+" (first used on line "+previous+").");
  codes.set(code.toLowerCase(),line);
  // Each failed CSV field identifies the import row before any create is run.
  // The caller's bulk service reports CREATED/SKIPPED/FAILED per valid row.
  for(const [field,text] of [["city",v(2)],["state",v(3)],["country",v(4)]] as const){
    if(text.length>128)throw Error("Row "+line+": "+field+" must be 128 characters or fewer.");
  }
  if(!/^[A-Za-z0-9-]{3,63}$/.test(code))
    throw Error("Row "+line+": college code must use 3–63 letters, numbers or hyphens.");
  return {line,name,code,city:v(2)||null,state:v(3)||null,country:v(4)||null};
 });
}
