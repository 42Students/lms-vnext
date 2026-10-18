/** Non-sensitive counts derived strictly from a stored learner-owned profile. */
export type TpoStudentProfileFacts={gender:string|null;birthYear:number|null;skills:number;projects:number;certifications:number;experiences:number;links:boolean;resume:boolean;codingProfiles:boolean;
  pgPercentage:number|null;degree:string|null;entranceExam:string|null;phoneMasked:string|null;linkedIn:string|null;github:string|null;portfolio:string|null};
export function tpoStudentProfileFacts(raw:unknown):TpoStudentProfileFacts{
 const doc=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const person=doc.personalDetails&&typeof doc.personalDetails==="object"&&!Array.isArray(doc.personalDetails)?doc.personalDetails as Record<string,unknown>:{};
 const social=doc.socialProfiles&&typeof doc.socialProfiles==="object"&&!Array.isArray(doc.socialProfiles)?doc.socialProfiles as Record<string,unknown>:{};
 const date=typeof person.dateOfBirth==="string"?person.dateOfBirth:"";
 const parsedBirthDate=/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(date+"T00:00:00.000Z"):null;
 const birthYear=parsedBirthDate&&!Number.isNaN(parsedBirthDate.getTime())&&
  parsedBirthDate.toISOString().slice(0,10)===date?parsedBirthDate.getUTCFullYear():null;
 const gender=typeof person.gender==="string"&&["Male","Female","Other"].includes(person.gender)?person.gender:null;
 const count=(key:string)=>Array.isArray(doc[key])?Math.min(doc[key].length,100):0;
 const nonempty=(value:unknown)=>typeof value==="string"&&value.trim().length>0;
 const resume=nonempty(doc.resumeDocumentId)||nonempty(doc.resumeUrl)||
   (doc.resume!==null&&typeof doc.resume==="object"&&!Array.isArray(doc.resume)&&Object.keys(doc.resume).length>0);
 const codingProfiles=(Array.isArray(doc.codingProfiles)&&doc.codingProfiles.length>0)||
   (Array.isArray(social.codingProfiles)&&social.codingProfiles.length>0)||
   ["leetcodeUrl","codechefUrl","codeforcesUrl","hackerrankUrl","geeksForGeeksUrl"].some(key=>nonempty(social[key]));
 const safeText=(value:unknown,max=160)=>typeof value==="string"&&value.trim()?value.trim().slice(0,max):null;
 const contact=doc.contactDetails&&typeof doc.contactDetails==="object"&&!Array.isArray(doc.contactDetails)?doc.contactDetails as Record<string,unknown>:{};
 const number=String(contact.phone??contact.mobileNumber??person.phone??person.mobileNumber??"").replace(/[^0-9]/g,"");
 const phoneMasked=number.length>=4?"••••"+number.slice(-4):null;
 const safeHttps=(value:unknown):string|null=>{
  if(typeof value!=="string")return null;
  try{const parsed=new URL(value);return parsed.protocol==="https:"&&!parsed.username&&!parsed.password?parsed.href.slice(0,500):null;}
  catch{return null;}
 };
 const education=Array.isArray(doc.education)?doc.education:[];
 const postgraduate=education.find(item=>{
  if(!item||typeof item!=="object"||Array.isArray(item))return false;
  const level=String((item as Record<string,unknown>).educationType??"").toUpperCase();
  return ["PG","POST_GRADUATE","POSTGRADUATE","MASTERS","MASTER"].some(kind=>level.includes(kind));
 }) as Record<string,unknown>|undefined;
 const percentValue=postgraduate?.percentage??postgraduate?.percentageMarks;
 const parsedPercentage=typeof percentValue==="number"?percentValue:
  typeof percentValue==="string"&&/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/.test(percentValue.trim())?
   Number(percentValue.trim()):NaN;
 const pgPercentage=Number.isFinite(parsedPercentage)&&parsedPercentage>=0&&parsedPercentage<=100?
  parsedPercentage:null;
 const degree=education.map(item=>item&&typeof item==="object"&&!Array.isArray(item)?
  safeText((item as Record<string,unknown>).degreeName??(item as Record<string,unknown>).degree):null)
  .filter((value):value is string=>value!==null).at(-1)??null;
 const entranceExam=safeText(doc.entranceExam??doc.entranceExamName);
 return {gender,birthYear,pgPercentage,degree,entranceExam,phoneMasked,
  linkedIn:safeHttps(social.linkedinUrl),github:safeHttps(social.githubUrl),portfolio:safeHttps(social.portfolioUrl),
  skills:count("skills"),projects:count("projects"),
  certifications:count("certifications"),experiences:count("experiences"),
  links:["linkedinUrl","githubUrl","portfolioUrl"].some(key=>safeHttps(social[key])!==null),resume,codingProfiles};
}
