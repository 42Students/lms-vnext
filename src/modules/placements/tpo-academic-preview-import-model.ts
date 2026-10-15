import {z} from "zod";
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
  const result=tpoAcademicPreviewRowSchema.parse({studentCode:studentCode.trim(),cgpa:cgpa.trim(),activeBacklogs:activeBacklogs.trim()});
  if(seen.has(result.studentCode))throw new Error("Duplicate learner UUID at row "+(index+2));
  seen.add(result.studentCode);return result;
 });
}
export function previewTpoAcademicPageMatches<T extends {studentCode:string}>(rows:readonly T[],scopedIds:readonly string[]){
 const ids=new Set(scopedIds);
 return rows.map(row=>({...row,matchedOnCurrentPage:ids.has(row.studentCode)}));
}
