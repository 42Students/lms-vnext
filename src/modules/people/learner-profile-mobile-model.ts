import type {LearnerProfileSection} from "./learner-profile-checklist";
/** Prioritize non-sensitive career editing; identity evidence is never a "required" step. */
const preferred:readonly LearnerProfileSection[]=[
  "profile-introduction","education","skills","projects","experiences","certifications",
  "achievements","languages","social-profiles","hobbies","extracurriculars","metadata",
];
export function learnerProfileMobileQuickLinks(items:readonly {
  section:LearnerProfileSection;label:string;completed:boolean;
}[]){
 const rank=new Map(preferred.map((section,index)=>[section,index]));
 return items.filter(item=>!item.completed&&rank.has(item.section))
  .sort((a,b)=>rank.get(a.section)!-rank.get(b.section)!)
  .slice(0,4).map(({section,label})=>({section,label}));
}
