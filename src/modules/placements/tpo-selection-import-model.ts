/** TPO-drive-workspace-48: parse small company selection CSVs before explicit review. */
export function parseSelectionCsv(text:string,strictBlankRows=false):string[][] {
 const rows:string[][]=[];let row:string[]=[];let field="";let quoted=false;let startedQuoted=false;let closedQuote=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'){
   if(quoted&&text[i+1]==='"'){field+='"';i++;}
   else if(quoted){quoted=false;closedQuote=true;}
   else if(field===""&&!startedQuoted){quoted=true;startedQuoted=true;}
   else throw Error("Unexpected quote inside a CSV field.");
  }else if(char===","&&!quoted){row.push(field.trim());field="";startedQuoted=false;closedQuote=false;}
  else if((char==="\n"||char==="\r")&&!quoted){
   if(char==="\r"&&text[i+1]==="\n")i++;
   row.push(field.trim());field="";startedQuoted=false;closedQuote=false;
   if(row.some(value=>value!==""))rows.push(row);
   else if(strictBlankRows)throw Error("Remove blank data rows from the file.");
   row=[];
  }else field+=char;
 }
 if(quoted)throw Error("Unclosed quoted value in the CSV.");
 row.push(field.trim());if(row.some(value=>value!==""))rows.push(row);
 if(rows.length>501)throw Error("Import up to 500 students at a time.");
 return rows;
}
export type SelectionImportCandidate={applicationId:string;name:string;email?:string|null;roleTitle:string;offerReady:boolean;alreadyOffered:boolean};
export type SelectionImportEntry={line:number;applicationId:string;name:string;roleTitle:string;annualCtcInr:number|null};
export function prepareSelectionImport(text:string,candidates:readonly SelectionImportCandidate[],roleFallback:string){
 const rows=parseSelectionCsv(text);
 if(rows.length<2)throw Error("The company selection file needs a header and at least one learner row.");
 const columns=rows.shift()?.map(s=>s.replace(/^\uFEFF/,"").toLowerCase().replace(/[\s_-]+/g,""))??[];
 const groups=[["applicationid","applicantid"],["email","studentemail"],
  ["student","studentname","name"],["role","roletitle","jobtitle"],
  ["package","packagelpa","ctclpa","annualctc","ctc"]];
 for(const aliases of groups)if(columns.filter(column=>aliases.includes(column)).length>1)
  throw Error("The selection file contains conflicting duplicate columns. Keep only one column for each field.");
 if(new Set(columns.filter(Boolean)).size!==columns.filter(Boolean).length)
  throw Error("Duplicate column headings are not permitted.");
 const locate=(...labels:string[])=>columns.findIndex(name=>labels.includes(name));
 const idColumn=locate("applicationid","applicantid"),emailColumn=locate("email","studentemail");
 const nameColumn=locate("student","studentname","name");
 const roleColumn=locate("role","roletitle","jobtitle");
 const packageColumn=locate("package","packagelpa","ctclpa","annualctc","ctc");
 if(idColumn<0&&emailColumn<0&&nameColumn<0)throw Error("CSV needs an Application ID, Email or Student name column.");
 if(rows.length>500)throw Error("Import up to 500 students at a time.");
 const accepted:SelectionImportEntry[]=[];const unmatched:Array<{line:number;value:string;reason:string}>=[];
 const seen=new Set<string>();
 rows.forEach((row,i)=>{
  const identifier=[idColumn,emailColumn,nameColumn].filter(i=>i>=0).map(i=>(row[i]??"").trim()).find(Boolean)??"";
  const identities=[
   idColumn>=0&&row[idColumn]?.trim()?{kind:"id",value:row[idColumn]!.trim().toLocaleLowerCase("en-IN")}:null,
   emailColumn>=0&&row[emailColumn]?.trim()?{kind:"email",value:row[emailColumn]!.trim().toLocaleLowerCase("en-IN")}:null,
   nameColumn>=0&&row[nameColumn]?.trim()?{kind:"name",value:row[nameColumn]!.trim().toLocaleLowerCase("en-IN")}:null,
  ].filter((item):item is {kind:string;value:string}=>item!==null);
  const matches=candidates.filter(c=>c.offerReady&&!c.alreadyOffered&&identities.length>0&&
   identities.every(v=>v.kind==="id"?c.applicationId.toLocaleLowerCase("en-IN")===v.value:
    v.kind==="email"?c.email?.toLocaleLowerCase("en-IN")===v.value:
    c.name.toLocaleLowerCase("en-IN")===v.value));
  if(matches.length!==1){unmatched.push({line:i+2,value:identifier,reason:matches.length?"Ambiguous student":"No eligible matching applicant"});return;}
  const candidate=matches[0]!;
  if(seen.has(candidate.applicationId)){unmatched.push({line:i+2,value:identifier,reason:"Duplicate in file"});return;}
  const packageText=packageColumn<0?"":row[packageColumn]?.trim()??"";
  const amount=packageText===""?null:/^\d{1,4}(?:\.\d{1,2})?$/.test(packageText)?Number(packageText):NaN;
  if(amount!==null&&(!Number.isFinite(amount)||amount<0||amount>1000)){
   unmatched.push({line:i+2,value:identifier,reason:"Package must be between 0 and 1000 LPA"});return;
  }
  const title=(roleColumn<0?"":row[roleColumn]??"").trim()||roleFallback||candidate.roleTitle;
  if(title.length<2||title.length>200){unmatched.push({line:i+2,value:identifier,reason:"Role title is invalid"});return;}
  seen.add(candidate.applicationId);
  accepted.push({line:i+2,applicationId:candidate.applicationId,name:candidate.name,
   roleTitle:title,annualCtcInr:amount===null?null:Math.round(amount*100000)});
 });
 return {accepted,unmatched,read:rows.length};
}
