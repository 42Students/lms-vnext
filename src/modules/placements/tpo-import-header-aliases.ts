/** Legacy TPO import headers (lms2-fe/lms-dev-2026: src/components/tpo/tpoFiles.js).
 * Comparison ignores case, whitespace and punctuation. Import callers must
 * whitelist the fields their server action actually accepts. */
export const TPO_HEADER_ALIASES={
 applicantId:["applicantid","applicationid","42lmsid","42lmsapplicantid","publicref","applicant"],
 companyId:["companyid","companyreference","companyref","candidateid","externalref","referenceid"],
 email:["email","emailid","mail","contactmail","workemail"],
 roll:["roll","rollno","rollnumber","regno","registrationnumber","regdno","usn"],
 phone:["phone","mobile","mobileno","phonenumber","contact","contactnumber"],
 name:["name","fullname","studentname","candidatename","personname"],
 outcome:["outcome","result","status","decision"],
 reasonCategory:["reason","reasoncategory","category"],
 waitlistRank:["rank","waitlistrank","waitlist"],
 score:["score","marks","percentage"],
 comment:["comment","comments","remarks","note"],
 roleOption:["role","roleoption","designation","track","profile"],
 ctcLpa:["ctc","ctclpa","package","packagelpa","salary"],
 kind:["kind","offertype","type"],
 company:["company","companyname","organisation","organization"],
 designation:["designation","title","jobtitle","position"],
 source:["source","leadsource","foundvia","channel","howfound","wherefound"],
 cgpa:["cgpa","gpa"],
 tenthPct:["tenth","10th","tenthpct","tenthpercentage","sslc","10thpercentage"],
 twelfthPct:["twelfth","12th","twelfthpct","twelfthpercentage","12thpercentage"],
 diplomaPct:["diploma","diplomapct","diplomapercentage"],
 ugPct:["ug","ugpct","ugpercentage"],
 gapYears:["gap","gapyears","educationgap"],
 passingYear:["passingyear","yearofpassing","graduationyear"],
 gender:["gender","sex"],
 batch:["batch","passoutyear","batchyear"],
 // vNext fields: do not conflate a roll number with a membership UUID.
 studentCode:["studentcode","studentid","learnerid","membershipid"],
 activeBacklogs:["activebacklogs","activebacklog","currentbacklogs"],
} as const;

export type TpoImportHeader=keyof typeof TPO_HEADER_ALIASES;
export const normalizeTpoImportHeader=(input:string)=>
 input.trim().toLowerCase().replace(/[^a-z0-9]/g,"");

/** Returns null for unknown or ambiguous aliases: never guess an import column. */
export function resolveTpoImportHeader(header:string,allowed:readonly TpoImportHeader[]):TpoImportHeader|null {
 const normalized=normalizeTpoImportHeader(header);
 if(!normalized)return null;
 const matches=allowed.filter(field=>{
  const key=normalizeTpoImportHeader(field);
  return key===normalized||(TPO_HEADER_ALIASES[field] as readonly string[]).includes(normalized);
 });
 return matches.length===1?matches[0]!:null;
}

/** Mapped indexes must be unique; duplicate aliases for one field are rejected. */
export function mapTpoImportHeaders(headers:readonly string[],allowed:readonly TpoImportHeader[]) {
 const mapped=headers.map(header=>resolveTpoImportHeader(header,allowed));
 const seen=new Set<TpoImportHeader>();
 const duplicates:TpoImportHeader[]=[];
 mapped.forEach(field=>{
  if(!field)return;
  if(seen.has(field))duplicates.push(field);
  seen.add(field);
 });
 return {
  fields:mapped,
  ignored:headers.filter((header,index)=>header.trim()&&!mapped[index]),
  duplicates:[...new Set(duplicates)],
 };
}
