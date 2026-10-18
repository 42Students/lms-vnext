import type {TpoStudentRow} from "./tpo-students-model";

/** Excel-safe TSV avoids command/formula evaluation when pasted into spreadsheets. */
export function tpoStudentClipboardCell(value:unknown):string{
 const raw=String(value??"").replace(/[\u0000-\u001F\u007F]/g," ");
 return /^[\s\u200B\uFEFF]*[=+@-]/u.test(raw)?"'"+raw:raw;
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
 const lookup=new Map<string,string|null>();
 for(const row of rows){
  for(const key of new Set([row.rollNumber,row.registrationNumber].filter(
   (value):value is string=>Boolean(value)).map(value=>value.trim().toLowerCase()))){
   // Duplicate roll identifiers are ambiguous; never select the last learner.
   const existing=lookup.get(key);
   lookup.set(key,existing===undefined?row.membershipId:
    existing===row.membershipId?existing:null);
  }
 }
 const found:string[]=[],missing:string[]=[];
 for(const roll of wanted){
  const id=lookup.get(roll.toLowerCase());if(id){if(!found.includes(id))found.push(id);}else missing.push(roll);
 }
 return {found,missing,requested:wanted.length};
}
