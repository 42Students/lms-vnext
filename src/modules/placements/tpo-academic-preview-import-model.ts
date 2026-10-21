import {z} from "zod";
import {mapTpoImportHeaders} from "./tpo-import-header-aliases";
export const tpoAcademicPreviewRowSchema=z.object({
 studentCode:z.string().uuid(),
 cgpa:z.coerce.number().min(0).max(10),
 activeBacklogs:z.coerce.number().int().min(0).max(100),
}).strict();
export function parseTpoAcademicPreviewCsv(csv:string){
 if(csv.length>50000)throw new Error("CSV exceeds 50,000 characters.");
 const rows=csv.trim().split(/\r?\n/);
 if(rows[0]?.trim()!=="studentCode,cgpa,activeBacklogs")throw new Error("Required header: studentCode,cgpa,activeBacklogs");
 if(rows.length>201)throw new Error("Maximum 200 data rows.");
 const seen=new Set<string>();
 return rows.slice(1).filter(Boolean).map((line,index)=>{
  if(line.includes('"')||line.split(",").length!==3)throw new Error("Invalid unquoted CSV at row "+(index+2));
  const [studentCode,cgpa,activeBacklogs]=line.split(",");
  const cgpaText=z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/).parse(cgpa.trim());
  const backlogText=z.string().regex(/^(?:0|[1-9]\d*)$/).parse(activeBacklogs.trim());
  const result=tpoAcademicPreviewRowSchema.parse({studentCode:studentCode.trim(),cgpa:Number(cgpaText),activeBacklogs:Number(backlogText)});
  if(seen.has(result.studentCode))throw new Error("Duplicate learner UUID at row "+(index+2));
  seen.add(result.studentCode);return result;
 });
}
export function previewTpoAcademicPageMatches<T extends {studentCode:string}>(rows:readonly T[],scopedIds:readonly string[]):Array<T&{matchedOnCurrentPage:boolean}>{
 const ids=new Set(scopedIds);
 return rows.map(row=>({...row,matchedOnCurrentPage:ids.has(row.studentCode)}));
}


/** Accept common LMS export header aliases without accepting ambiguous fields.
 * Import identifiers are college membership UUIDs, as in the Students CSV. */
export function parseTpoAcademicImportCsv(csv: string) {
 if (csv.length > 200000) throw new Error("CSV exceeds 200,000 characters.");
 const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
 if (lines.length < 2) throw new Error("CSV needs a header and at least one student row.");
 if (lines.length > 201) throw new Error("Maximum 200 data rows.");
 const clean = (v: string) => v.trim().replace(/^"|"$/g, "");
 const rawHeaders=lines[0]!.split(",").map(clean);
 const mapped=mapTpoImportHeaders(rawHeaders,["studentCode","cgpa","activeBacklogs"]);
 if(mapped.duplicates.length)throw new Error("Duplicate import headers: "+mapped.duplicates.join(", "));
 const lookup=(field:"studentCode"|"cgpa"|"activeBacklogs",label:string)=>{
  const index=mapped.fields.indexOf(field);
  if(index<0)throw new Error("Expected one "+label+" column.");
  return index;
 };
 const idColumn=lookup("studentCode","student ID");
 const cgpaColumn=lookup("cgpa","CGPA");
 const backlogColumn=lookup("activeBacklogs","active backlogs");
 const header=rawHeaders;
 if (new Set([idColumn, cgpaColumn, backlogColumn]).size !== 3)
   throw new Error("Use separate student ID, CGPA and active backlog columns.");
 const seen = new Set<string>();
 return lines.slice(1).filter(line => line.trim()).map((line, index) => {
   if (line.includes("\n") || line.split(",").length !== header.length)
     throw new Error("Invalid CSV row " + (index + 2));
   const cells = line.split(",").map(clean);
   const studentCode = cells[idColumn]!;
   const cgpaText = cells[cgpaColumn]!;
   const backlogText = cells[backlogColumn]!;
   if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(cgpaText) ||
       !/^(?:0|[1-9]\d*)$/.test(backlogText))
     throw new Error("Invalid CGPA or backlog at row " + (index + 2));
   const data = tpoAcademicPreviewRowSchema.parse({
     studentCode, cgpa: Number(cgpaText), activeBacklogs: Number(backlogText),
   });
   if (seen.has(data.studentCode)) throw new Error("Repeated student ID at row " + (index + 2));
   seen.add(data.studentCode);
   return data;
 });
}

/** Legacy academic CSV staging: preserve sparse fields and roll references
 * without mistaking a roll number for a globally authorized membership ID.
 * Callers must resolve each roll within the authenticated college before
 * passing UUID-only records to the verified evidence mutation. */
export type TpoLegacyAcademicStagingRow={
 rowNumber:number; rollNumber:string; studentCode:string|null;
 cgpa:number|null; activeBacklogs:number|null; tenthPct:number|null;
 twelfthPct:number|null; diplomaPct:number|null; ugPct:number|null;
 gapYears:number|null; passingYear:number|null; batch:string|null; gender:string|null;
 issue:string|null;
};
export const TPO_LEGACY_ACADEMIC_MAX_ROWS=5000;
export const TPO_LEGACY_ACADEMIC_EXTENSIONS=[".csv",".xlsx"] as const;
function legacyAcademicNumber(raw:string,field:string,row:number,max:number,min=0):number|null{
 if(!raw.trim())return null;
 const value=Number(raw.trim());
 if(!Number.isFinite(value)||value<min||value>max)
  throw new Error(field+" must be between "+min+" and "+max+" at row "+row+".");
 return value;
}
function legacyAcademicCells(line:string):string[]{
 const cells:string[]=[];let value="",quoted=false;
 for(let i=0;i<line.length;i++){
  const char=line[i]!;
  if(char==='"'){
   if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;
  }else if(char===","&&!quoted){cells.push(value.trim());value="";}
  else value+=char;
 }
 if(quoted)throw new Error("Unclosed quoted CSV field.");
 cells.push(value.trim());return cells;
}
export function parseTpoLegacyAcademicImportCsv(csv:string):TpoLegacyAcademicStagingRow[]{
 if(csv.length>5_000_000)throw new Error("Academic import file is too large.");
 const lines=csv.replace(/^\uFEFF/,"").trim().split(/\r?\n/);
 if(lines.length<2)throw new Error("The file must include a header and at least one student.");
 if(lines.length-1>TPO_LEGACY_ACADEMIC_MAX_ROWS)
  throw new Error("Maximum 5000 students per import.");
 const fields=["roll","studentCode","cgpa","activeBacklogs","tenthPct","twelfthPct",
  "diplomaPct","ugPct","gapYears","passingYear","batch","gender"] as const;
 const mapped=mapTpoImportHeaders(legacyAcademicCells(lines[0]!),fields);
 if(mapped.duplicates.length)throw new Error("Duplicate import headers: "+mapped.duplicates.join(", "));
 if(!mapped.fields.includes("roll")&&!mapped.fields.includes("studentCode"))
  throw new Error("Include Roll Number or Student ID.");
 const seen=new Set<string>();
 return lines.slice(1).filter(line=>line.trim()).map((line,index)=>{
  const rowNumber=index+2;
  const cells=legacyAcademicCells(line);
  if(cells.length!==mapped.fields.length)throw new Error("Invalid academic CSV at row "+rowNumber+".");
  const val=(key:typeof fields[number])=>cells[mapped.fields.indexOf(key)]??"";
  const rollNumber=val("roll").trim();
  const studentCode=val("studentCode").trim()||null;
  const key=(rollNumber||studentCode||"").toLowerCase();
  let issue:string|null=null;
  if(!key)issue="Roll number or Student ID is required";
  else if(seen.has(key))issue="Duplicate roll number / Student ID";
  else seen.add(key);
  const cgpa=legacyAcademicNumber(val("cgpa"),"CGPA",rowNumber,10);
  const activeBacklogs=legacyAcademicNumber(val("activeBacklogs"),"Active backlogs",rowNumber,100);
  const tenthPct=legacyAcademicNumber(val("tenthPct"),"10th percentage",rowNumber,100);
  const twelfthPct=legacyAcademicNumber(val("twelfthPct"),"12th percentage",rowNumber,100);
  const diplomaPct=legacyAcademicNumber(val("diplomaPct"),"Diploma percentage",rowNumber,100);
  const ugPct=legacyAcademicNumber(val("ugPct"),"UG percentage",rowNumber,100);
  const gapYears=legacyAcademicNumber(val("gapYears"),"Gap years",rowNumber,15);
  const passingYear=legacyAcademicNumber(val("passingYear"),"Passing year",rowNumber,2100,1980);
  return {rowNumber,rollNumber,studentCode,cgpa,activeBacklogs,tenthPct,
   twelfthPct,diplomaPct,ugPct,gapYears,passingYear,
   batch:val("batch")||null,gender:val("gender")||null,issue};
 });
}
