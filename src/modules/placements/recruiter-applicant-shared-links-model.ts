import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";

/** REC-home-drives-38: a learner-supplied profile is not a trusted document.
 * Parse only known fields and never project the original JSON into recruiter UI.
 * File receipts/resumes are deliberately excluded until an authorized
 * storage signing endpoint exists.
 */
export function safeRecruiterExternalLink(raw:unknown,github=false):string|null{
 if(typeof raw!=="string"||raw.length>2000)return null;
 try{
  const url=new URL(raw.trim());
  if(url.protocol!=="https:"||url.username||url.password||!url.hostname)return null;
  if(["localhost","127.0.0.1","::1"].includes(url.hostname.toLowerCase()))return null;
  if(github&&!["github.com","www.github.com"].includes(url.hostname.toLowerCase()))return null;
  url.hash="";
  return url.toString();
 }catch{return null;}
}
export function projectRecruiterProfileLinks(raw:unknown,policy:{
 projects:boolean;skills:boolean;
}){
 const parsed=learnerProfileDocumentSchema.safeParse(raw);
 if(!parsed.success)return {githubUrl:null,portfolioUrl:null,
  skills:[] as string[],projects:[] as Array<{name:string;url:string}>};
 const document=parsed.data;
 const projects=policy.projects?document.projects.flatMap(p=>{
  const url=safeRecruiterExternalLink(p.projectUrl)||safeRecruiterExternalLink(p.githubUrl,true);
  return url&&p.name?[{name:p.name,url}]:[];
 }).slice(0,10):[];
 const skills=policy.skills?[...new Set(document.skills.map(s=>s.name.trim())
  .filter(Boolean))].slice(0,30):[];
 return {
  githubUrl:policy.projects?safeRecruiterExternalLink(document.socialProfiles.githubUrl,true):null,
  portfolioUrl:policy.projects?safeRecruiterExternalLink(document.socialProfiles.portfolioUrl):null,
  skills,projects,
 };
}
