import {z} from "zod";
import {parseSelectionCsv} from "./tpo-selection-import-model";
import {parseResultXlsx} from "./tpo-result-xlsx-model";
export const roundImportActionSchema=z.object({
 action:z.literal("STAGE_IMPORT"),confirmed:z.literal(true),
 previewToken:z.string().regex(/^[0-9a-f]{64}$/, "Invalid round import preview token"),
 missingPolicy:z.enum(["LEAVE_PENDING","MARK_NOT_CLEARED"]),
 overrides:z.array(z.object({line:z.number().int().positive(),applicationId:z.string().uuid()}).strict()).max(1000),
 skippedLines:z.array(z.number().int().positive()).max(1000),
}).strict().superRefine((command,ctx)=>{
 const lines=command.overrides.map(item=>item.line);
 const ids=command.overrides.map(item=>item.applicationId);
 if(new Set(lines).size!==lines.length)ctx.addIssue({code:"custom",path:["overrides"],message:"Only one override per source row is permitted"});
 if(new Set(ids).size!==ids.length)ctx.addIssue({code:"custom",path:["overrides"],message:"A learner may be matched only once"});
 if(new Set(command.skippedLines).size!==command.skippedLines.length)
  ctx.addIssue({code:"custom",path:["skippedLines"],message:"Duplicate skipped rows are not permitted"});
 if(lines.some(line=>command.skippedLines.includes(line)))
  ctx.addIssue({code:"custom",path:["skippedLines"],message:"A source row cannot be both matched and skipped"});
});
export type ImportRow={line:number;identity:string;applicationId:string;email:string;roll:string;companyId:string;name:string;
 outcome:"PASS"|"FAIL"|"HOLD"|"ABSENT"|null;rank:number|null;invalidRank:boolean;message:string|null};
/** TPO-drive-workspace-40: collapse identical JOIN duplicates, but never
 * choose a winner when identity, screening or current-result evidence differs.
 * A corrupt/ambiguous row cannot be staged for a different applicant.
 */
export function uniqueTpoRoundImportRoster<T extends {applicationId:string}>(rows:readonly T[]):T[]{
 const byId=new Map<string,T>(),conflicts=new Set<string>();
 for(const row of rows){
  const previous=byId.get(row.applicationId);
  if(previous&&JSON.stringify(previous)!==JSON.stringify(row))
   conflicts.add(row.applicationId);
  else if(!previous)byId.set(row.applicationId,row);
 }
 return [...byId].filter(([id])=>!conflicts.has(id)).map(([,row])=>row);
}
/** A company result may carry several identity columns. Intersect *all* of
 * them; never guess a learner from the first matching email or roll number.
 * A portal/candidate ID is intentionally not part of this internal match.
 */
export function matchTpoRoundImportRoster<T extends {
 applicationId:string;email:string|null;roll:string|null;
}>(row:Pick<ImportRow,"applicationId"|"email"|"roll">,roster:readonly T[]):T[]{
 const methods=[
  row.applicationId?roster.filter(item=>item.applicationId.toLowerCase()===row.applicationId.toLowerCase()):null,
  row.email?roster.filter(item=>item.email?.toLowerCase()===row.email.toLowerCase()):null,
  row.roll?roster.filter(item=>item.roll?.toLowerCase()===row.roll.toLowerCase()):null,
 ].filter((matches):matches is T[]=>matches!==null);
 if(!methods.length)return [];
 return methods[0]!.filter(candidate=>methods.every(matches=>matches.some(
  item=>item.applicationId===candidate.applicationId)));
}
function outcome(value:string):ImportRow["outcome"]{
 const token=value.toUpperCase().replace(/[^A-Z]/g,"");
 if(["PASS","PASSED","CLEAR","CLEARED","SELECTED","SHORTLISTED"].includes(token))return "PASS";
 if(["FAIL","FAILED","NOTCLEARED","REJECTED","NOTSELECTED"].includes(token))return "FAIL";
 if(["WAITLIST","WAITLISTED","HOLD","WAITING"].includes(token))return "HOLD";
 if(["ABSENT","NOSHOW","MARKEDABSENT"].includes(token))return "ABSENT";
 return null;
}
export function parseTpoRoundImport(bytes:Buffer,filename:string){
 if(bytes.length>3_000_000)throw Error("Files must be smaller than 3 MB.");
 const ext=filename.toLowerCase();
 const grid=ext.endsWith(".xlsx")?parseResultXlsx(bytes):
  ext.endsWith(".csv")?parseSelectionCsv(bytes.toString("utf8"),true,1000):
  (()=>{throw Error("Use a .xlsx or a .csv file.");})();
 const header=grid.shift()??[];
 if(header.length>80||grid.some(row=>row.length>80))
  throw Error("The result file is too wide; keep at most 80 columns.");
 if(!header.length||header.every(value=>!value.trim()))throw Error("The result file is missing its header row.");
 const heads=header.map(x=>x.replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[\s_-]+/g,""));
 if(new Set(heads.filter(Boolean)).size!==heads.filter(Boolean).length)
  throw Error("Duplicate column headers make this result import ambiguous. Keep one column of each type.");
 const groups=[["applicationid","applicantid"],["email","studentemail"],
  ["roll","rollnumber","studentroll"],["companyid","portalid","candidateid"],
  ["result","outcome","status","decision"],["waitlistrank","rank"],
  ["reason","message","studentmessage","comment"]];
 for(const aliases of groups){
  if(heads.filter(head=>aliases.includes(head)).length>1)
   throw Error("This result file contains more than one column for the same field. Keep only one.");
 }
 const locate=(...words:string[])=>heads.findIndex(x=>words.includes(x));
 const app=locate("applicationid","applicantid"),email=locate("email","studentemail"),
  roll=locate("roll","rollnumber","studentroll"),company=locate("companyid","portalid","candidateid"),
  status=locate("result","outcome","status","decision"),rank=locate("waitlistrank","rank"),
  message=locate("reason","message","studentmessage","comment"),name=locate("student","studentname","name");
 if(status<0||Math.max(app,email,roll)<0)throw Error("Include Result and an Application ID, Email or Roll number column. Company portal IDs are not mapped to internal applicants.");
 if(grid.length>1000)throw Error("Import up to 1,000 student rows per file.");
 if(grid.length===0)throw Error("The results file has no student rows.");
 if(grid.some(parts=>parts.every(value=>!value.trim())))throw Error("Remove blank data rows from the result file.");
 const rows:ImportRow[]=grid.map((parts,i)=>{
  const value=(col:number)=>col>=0?parts[col]?.trim()??"":"";
  const rankText=value(rank);
  const rankTextValid=/^[1-9][0-9]{0,5}$/.test(rankText)&&Number(rankText)<=100000;
  const rankValue=rankTextValid?Number(rankText):null;
  const result=outcome(value(status));
  return {line:i+2,identity:value(app)||value(company)||value(email)||value(roll),
   applicationId:value(app),email:value(email),roll:value(roll),companyId:value(company),name:value(name),
   outcome:result,invalidRank:rankText!==""&&(result!=="HOLD"||!rankTextValid),
   // A rank is actionable only for a waitlisted learner; never carry a
   // numerically valid rank from a PASS, FAIL or ABSENT import row.
   rank:result==="HOLD"?rankValue:null,
   message:value(message)||null};
 });
 return rows;
}
export const ROUND_IMPORT_TEMPLATE="Application ID,Email,Roll number,Result,Waitlist rank,Student message\n";
