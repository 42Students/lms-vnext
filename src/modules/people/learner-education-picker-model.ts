export const LEARNER_QUALIFYING_EXAM_DETAILS=[
 {key:"board",label:"Board or issuing authority",maxLength:120},
 {key:"rollNumber",label:"Roll / hall ticket number",maxLength:120},
 {key:"passingYear",label:"Exam passing year",maxLength:4},
 {key:"score",label:"Marks, rank or score",maxLength:120},
] as const;
/** Generic optional details until a college's configured exam fields are
 * registered in this platform. Unknown imported keys remain intact. */
export const LEARNER_EDUCATION_TYPES=["10th","12th","Diploma","UG","PG","PhD","Other"] as const;
export const LEARNER_QUALIFYING_EXAMS=[
 "SSC","CBSE 10th","ICSE","Intermediate","CBSE 12th","Diploma",
 "B.Tech","B.E.","B.Sc.","B.Com.","B.A.","M.Tech","M.E.","MBA","M.Sc.","PhD",
] as const;
/** Catalog suggestions only: colleges may use their own exam names. Do not
 * coerce imported or manually entered exam names into these display options. */
export function learnerQualifyingExamSuggestions(educationType:string):readonly string[]{
 switch(educationType){
  case "10th":return ["SSC","CBSE 10th","ICSE"];
  case "12th":return ["Intermediate","CBSE 12th"];
  case "Diploma":return ["Diploma"];
  case "UG":return ["B.Tech","B.E.","B.Sc.","B.Com.","B.A."];
  case "PG":return ["M.Tech","M.E.","MBA","M.Sc."];
  case "PhD":return ["PhD"];
  default:return LEARNER_QUALIFYING_EXAMS;
 }
}
/** Keep historical free-text institutions/exams, but validate numeric grade range
 * and impossible year order both in UI and server Zod writes. */
export function learnerEducationValidationProblem(input:{
 educationType?:string;institution?:string;gradingType?:string;gradeObtained?:string;
 maxGrade?:string;startYear?:string;endYear?:string;isCurrentlyPursuing?:boolean;
 examDetails?:Record<string,string|number|boolean>;
}):{field:string;message:string}|null{
 const educationType=input.educationType?.trim()??"";
 if(!educationType)return {field:"educationType",message:"Education type is required"};
 // Historic qualifications and tenant-configured program types may not be
 // present in this safe offline catalog. Do not discard unknown imported names.
 if(educationType.length>120)
  return {field:"educationType",message:"Education type must be 120 characters or fewer"};
 if(!input.institution?.trim())return {field:"institution",message:"Institution name is required"};
 if(!input.gradingType?.trim())return {field:"gradingType",message:"Grading type is required"};
 if(!input.gradeObtained?.trim())return {field:"gradeObtained",message:"Grade obtained is required"};
 if(input.gradingType!=="Grade"&&!input.maxGrade?.trim())
  return {field:"maxGrade",message:"Max grade is required for job screening"};
 const examYear=String(input.examDetails?.passingYear??"").trim();
 if(examYear && (!/^\d{4}$/.test(examYear)||Number(examYear)<1900||Number(examYear)>2200))
  return {field:"examDetails.passingYear",message:"Enter a valid four-digit exam year (1900–2200)"};
 if(input.isCurrentlyPursuing&&input.endYear?.trim()&&Number(input.endYear)<new Date().getUTCFullYear())
  return {field:"endYear",message:"A currently pursued qualification cannot end in the past"};
 const start=input.startYear?.trim(),end=input.endYear?.trim();
 for(const [field,year] of [["startYear",start],["endYear",end]] as const){
  if(year && (!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>2200))
   return {field,message:"Enter a valid four-digit academic year (1900–2200)"};
 }

 if(start&&end&&/^\d{4}$/.test(start)&&/^\d{4}$/.test(end)&&Number(end)<Number(start))
  return {field:"endYear",message:"End year cannot be before start year"};
 const grade=input.gradeObtained?.trim().replace(/%$/, "").trim()??"";
 if(!grade)return null;
 if(input.gradingType!=="CGPA"&&input.gradingType!=="Percentage")return null;
 const num=Number(grade);
 const max=input.gradingType==="CGPA"?10:100;
 if(!Number.isFinite(num)||num<0||num>max)
  return {field:"gradeObtained",message:"Enter a "+input.gradingType+" between 0 and "+max};
 if(input.maxGrade?.trim()){
  const top=Number(input.maxGrade);
  if(!Number.isFinite(top)||top<=0||top>max||num>top)
   return {field:"maxGrade",message:"Maximum grade must include the obtained grade and be at most "+max};
 }
 return null;
}

/** Pure, versioned projection of college-configured EducationConfig,
 * ExamConfig and grading types. A server service must authorize the learner's
 * own college before supplying a catalog; these helpers never fetch another
 * tenant's configuration from a browser.
 */
export type LearnerEducationCatalog = {
 version:string;
 educationTypes:readonly string[];
 programsByType:Readonly<Record<string,readonly string[]>>;
 examsByType:Readonly<Record<string,readonly string[]>>;
 gradingTypes:readonly string[];
};
export const DEFAULT_LEARNER_EDUCATION_CATALOG:LearnerEducationCatalog={
 version:"legacy-fallback-1",
 educationTypes:LEARNER_EDUCATION_TYPES,
 programsByType:{
  "10th":["SSC","CBSE 10th","ICSE"],"12th":["Intermediate","CBSE 12th"],
  "Diploma":["Diploma"],"UG":["B.Tech","B.E.","B.Sc.","B.Com","B.A."],
  "PG":["M.Tech","M.E.","MBA","M.Sc."],"PhD":["PhD"],Other:[],
 },
 examsByType:{
  "10th":["SSC","CBSE 10th","ICSE"],"12th":["Intermediate","CBSE 12th"],
  "Diploma":["Diploma"],"UG":["B.Tech","B.E.","B.Sc.","B.Com.","B.A."],
  "PG":["M.Tech","M.E.","MBA","M.Sc."],"PhD":["PhD"],Other:[],
 },
 gradingTypes:["CGPA","GPA","Percentage","Grade"],
};
function uniqueConfigured(values:readonly string[]|undefined, fallback:readonly string[]):string[]{
 const source=values&&values.length?values:fallback;
 return [...new Set(source.map(value=>value.trim()).filter(Boolean))];
}
export function learnerEducationChoices(catalog:LearnerEducationCatalog|null|undefined,
 educationType:string,storedProgram?:string|null){
 const config=catalog??DEFAULT_LEARNER_EDUCATION_CATALOG;
 const defaults=DEFAULT_LEARNER_EDUCATION_CATALOG;
 const types=uniqueConfigured(config.educationTypes,defaults.educationTypes);
 const programs=uniqueConfigured(config.programsByType[educationType],
  defaults.programsByType[educationType]??[]);
 const exams=uniqueConfigured(config.examsByType[educationType],
  defaults.examsByType[educationType]??learnerQualifyingExamSuggestions(educationType));
 return {
  version:config.version,
  educationTypes:types,
  programs:storedProgram&&!programs.includes(storedProgram)?[...programs,storedProgram]:programs,
  exams,
  gradingTypes:uniqueConfigured(config.gradingTypes,defaults.gradingTypes),
 };
}
/** Changing the education type invalidates the dependent program and
 * specialization, but never destroys the entered institution or grade. */
export function switchLearnerEducationType<T extends {
 educationType:string;program:string;specialization:string
}>(row:T,nextType:string):T {
 return row.educationType===nextType?row:
  {...row,educationType:nextType,program:"",specialization:""};
}
export function learnerQualifyingExamConfig(catalog:LearnerEducationCatalog|null|undefined,
 educationType:string,examCode:string):{code:string;fields:typeof LEARNER_QUALIFYING_EXAM_DETAILS}{
 const configured=learnerEducationChoices(catalog,educationType).exams;
 const code=examCode.trim();
 if(!code||!configured.some(exam=>exam.toLocaleLowerCase("en-IN")===code.toLocaleLowerCase("en-IN")))
  throw new Error("Exam config not found for: "+code);
 return {code,fields:LEARNER_QUALIFYING_EXAM_DETAILS};
}
/** Application qualification records require exactly one recent/primary item;
 * generic draft entries can still be partial until final submission. */
export function learnerPrimaryQualificationProblem(
 rows:readonly {isRecentEducation?:boolean|string|number|null}[],
):string|null{
 const selected=rows.filter(row=>
  row.isRecentEducation===true||row.isRecentEducation==="true"||
  row.isRecentEducation===1).length;
 return selected===1?null:"Exactly ONE qualification must have isRecentEducation = true";
}
