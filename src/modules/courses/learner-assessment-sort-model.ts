import {z} from "zod";
export const LEARNER_ASSESSMENT_SORT_OPTIONS=[
 {value:"DUE",label:"Earliest due first"},
 {value:"CREATED",label:"Newest published first"},
 {value:"TITLE",label:"Title A–Z"},
] as const;
export type LearnerAssessmentSort=(typeof LEARNER_ASSESSMENT_SORT_OPTIONS)[number]["value"];
const schema=z.enum(["DUE","CREATED","TITLE"]).catch("DUE");
type Assessment={id:string;dueAt:string|null;createdAt:string;title:string};
const when=(value:string|null):number|null=>{
 if(!value)return null;
 const ms=Date.parse(value);
 return Number.isFinite(ms)?ms:null;
};
export function learnerAssessmentSort<T extends Assessment>(items:readonly T[],modeInput:unknown):T[]{
 const mode=schema.parse(modeInput);
 return [...items].sort((a,b)=>{
  if(mode==="TITLE")return a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
  if(mode==="CREATED"){
   const x=when(a.createdAt),y=when(b.createdAt);
   if(x===null&&y!==null)return 1;
   if(y===null&&x!==null)return -1;
   return (y??0)-(x??0)||a.id.localeCompare(b.id);
  }
  const x=when(a.dueAt),y=when(b.dueAt);
  if(x===null&&y!==null)return 1;
  if(y===null&&x!==null)return -1;
  return (x??0)-(y??0)||a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
 });
}
