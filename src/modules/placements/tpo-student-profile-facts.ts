/** Non-sensitive counts derived strictly from a stored learner-owned profile. */
export type TpoStudentProfileFacts={gender:string|null;birthYear:number|null;skills:number;projects:number;certifications:number;experiences:number;links:boolean;resume:boolean;codingProfiles:boolean};
export function tpoStudentProfileFacts(raw:unknown):TpoStudentProfileFacts{
 const doc=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const person=doc.personalDetails&&typeof doc.personalDetails==="object"&&!Array.isArray(doc.personalDetails)?doc.personalDetails as Record<string,unknown>:{};
 const social=doc.socialProfiles&&typeof doc.socialProfiles==="object"&&!Array.isArray(doc.socialProfiles)?doc.socialProfiles as Record<string,unknown>:{};
 const date=typeof person.dateOfBirth==="string"?person.dateOfBirth:"";
 const birthYear=/^\d{4}-\d{2}-\d{2}$/.test(date)?Number(date.slice(0,4)):null;
 const gender=typeof person.gender==="string"&&["Male","Female","Other"].includes(person.gender)?person.gender:null;
 const count=(key:string)=>Array.isArray(doc[key])?Math.min(doc[key].length,100):0;
 const nonempty=(value:unknown)=>typeof value==="string"&&value.trim().length>0;
 const resume=nonempty(doc.resumeDocumentId)||nonempty(doc.resumeUrl)||
   (doc.resume!==null&&typeof doc.resume==="object"&&Object.keys(doc.resume).length>0);
 const codingProfiles=(Array.isArray(doc.codingProfiles)&&doc.codingProfiles.length>0)||
   (Array.isArray(social.codingProfiles)&&social.codingProfiles.length>0)||
   ["leetcodeUrl","codechefUrl","codeforcesUrl","hackerrankUrl","geeksForGeeksUrl"].some(key=>nonempty(social[key]));
 return {gender,birthYear,skills:count("skills"),projects:count("projects"),
  certifications:count("certifications"),experiences:count("experiences"),
  links:["linkedinUrl","githubUrl","portfolioUrl"].some(key=>nonempty(social[key])),resume,codingProfiles};
}
