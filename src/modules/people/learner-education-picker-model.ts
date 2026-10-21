export const LEARNER_QUALIFYING_EXAM_DETAILS=[
 {key:"board",label:"Board or issuing authority",maxLength:120},
 {key:"rollNumber",label:"Roll / hall ticket number",maxLength:120},
 {key:"passingYear",label:"Exam passing year",maxLength:4},
 {key:"score",label:"Marks, rank or score",maxLength:120},
] as const;
/** Generic optional details until a college's configured exam fields are
 * registered in this platform. Unknown imported keys remain intact. */
export const LEARNER_EDUCATION_TYPES=["10th","12th","Diploma","UG","PG"] as const;
export const LEARNER_QUALIFYING_EXAMS=[
 "SSC","CBSE 10th","ICSE","Intermediate","CBSE 12th","Diploma",
 "B.Tech","B.E.","B.Sc.","B.Com.","B.A.","M.Tech","M.E.","MBA","M.Sc.",
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
 if(!LEARNER_EDUCATION_TYPES.some(level=>level===educationType))
  return {field:"educationType",message:"Choose a valid education type"};
 if(!input.institution?.trim())return {field:"institution",message:"Institution name is required"};
 if(!input.gradingType?.trim())return {field:"gradingType",message:"Grading type is required"};
 if(!input.gradeObtained?.trim())return {field:"gradeObtained",message:"Grade obtained is required"};
 if(!input.maxGrade?.trim())return {field:"maxGrade",message:"Max grade is required for job screening"};
 const examYear=String(input.examDetails?.passingYear??"").trim();
 if(examYear && (!/^\d{4}$/.test(examYear)||Number(examYear)<1900||Number(examYear)>2100))
  return {field:"examDetails.passingYear",message:"Enter a valid four-digit exam year (1900–2100)"};
 if(input.isCurrentlyPursuing&&input.endYear?.trim()&&Number(input.endYear)<new Date().getUTCFullYear())
  return {field:"endYear",message:"A currently pursued qualification cannot end in the past"};
 const start=input.startYear?.trim(),end=input.endYear?.trim();
 for(const [field,year] of [["startYear",start],["endYear",end]] as const){
  if(year && (!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>2100))
   return {field,message:"Enter a valid four-digit academic year (1900–2100)"};
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
