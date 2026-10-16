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
 const header = lines[0]!.split(",").map(value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, ""));
 const lookup = (aliases: string[], label: string) => {
   const indexes = aliases.flatMap(alias => header.map((value, index) => value === alias ? index : -1))
      .filter(index => index >= 0);
   if (indexes.length !== 1) throw new Error("Expected one " + label + " column.");
   return indexes[0]!;
 };
 const idColumn = lookup(["studentcode","studentid","learnerid","membershipid"], "student ID");
 const cgpaColumn = lookup(["cgpa","gpa","gradepointaverage"], "CGPA");
 const backlogColumn = lookup(["activebacklogs","activebacklog","currentbacklogs"], "active backlogs");
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
