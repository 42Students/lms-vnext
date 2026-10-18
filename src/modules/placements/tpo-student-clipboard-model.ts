import type {TpoStudentRow} from "./tpo-students-model";

/** Excel-safe TSV avoids command/formula evaluation when pasted into spreadsheets. */
export function tpoStudentClipboardCell(value:unknown):string{
 const raw=String(value??"").replace(/[\u0000-\u001F\u007F]/g," ");
 return /^[\p{Z}\p{Cf}\p{Cc}\p{M}]*[=+@-]/u.test(raw)?"'"+raw:raw;
}
export function tpoStudentClipboardTsv(rows:readonly TpoStudentRow[]):string{
 const headers=["Student","Student number","Program","Batch","Branch","Stage","Applications","Offers","Offers awaiting answer","Best so far"];
 const data=rows.map(row=>[row.displayName,row.rollNumber??row.registrationNumber??"",
  row.programName,row.cohortName,row.branchName,row.journeyState.replaceAll("_"," "),
  row.applicationCount,row.offerCount,row.offersAwaitingAnswer,row.bestSoFar]);
 return [headers,...data].map(line=>line.map(tpoStudentClipboardCell).join("\t")).join("\r\n");
}
export function matchTpoStudentRolls(rows:readonly TpoStudentRow[],raw:string){
 const wanted=[...new Set(raw.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean))].slice(0,1000);
 // Duplicate roll/registration numbers are ambiguous. Never silently choose
 // the last membership in a multi-learner import or bulk action.
 const lookup=new Map<string,string|null>();
 for(const row of rows){
  for(const value of [row.rollNumber,row.registrationNumber]){
   if(!value?.trim())continue;
   const key=value.trim().toLowerCase();
   if(lookup.has(key)&&lookup.get(key)!==row.membershipId)lookup.set(key,null);
   else if(!lookup.has(key))lookup.set(key,row.membershipId);
  }
 }
 const found:string[]=[],missing:string[]=[];
 for(const roll of wanted){
  const id=lookup.get(roll.toLowerCase());if(id){if(!found.includes(id))found.push(id);}else missing.push(roll);
 }
 return {found,missing,requested:wanted.length};
}
