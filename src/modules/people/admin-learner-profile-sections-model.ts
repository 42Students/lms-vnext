/** Legacy ProfileSectionsPanel learner section order and names.
 * Never emit opaque private document identifiers or storage paths to a page. */
export const ADMIN_LEARNER_PROFILE_SECTIONS = [
 ["header","Header"],["about","About"],["personalDetails","Personal Details"],
 ["identity","Identity Documents"],["languages","Languages"],["contact","Contact"],
 ["address","Address"],["social","Social Profiles"],["education","Education"],
 ["jobPreferences","Job Preferences"],["resume","Resume"],
 ["certifications","Certifications"],["achievements","Achievements"],
 ["skills","Skills"],["projects","Projects"],["experiences","Experience / Internships"],
 ["extracurricular","Extra-curricular"],["hobbies","Hobbies & Interests"],
 ["videoIntro","Video Intro"],["metadata","Metadata"],
] as const;

export type AdminLearnerProfileSection = {
 key:(typeof ADMIN_LEARNER_PROFILE_SECTIONS)[number][0];
 label:string;
 present:boolean;
 entries:readonly {label:string;value:string}[];
};

const restrictedField=/(?:password|passcode|secret|token|credential|api[_-]?key|(?:^|[_-])key$|bucket|(?:object|storage)[_-]?(?:path|key)|private|aadhaar|aadhar|passport|panNumber|identityNumber|documentNumber|signedUrl|presigned|accessCode)/i;
const privateSections=new Set<string>(["identity","resume","videoIntro"]);
const record=(value:unknown):value is Record<string,unknown> =>
 typeof value==="object"&&value!==null&&!Array.isArray(value);
const short=(s:string)=>s.trim().slice(0,240);
const labelField=(field:string)=>field.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/[_-]/g," ")
 .replace(/\b\w/g,letter=>letter.toUpperCase());

function present(value:unknown):boolean{
 if(value===null||value===undefined)return false;
 if(typeof value==="string")return value.trim().length>0;
 if(Array.isArray(value))return value.some(present);
 if(record(value))return Object.values(value).some(present);
 return true;
}
function describe(value:unknown):string|null{
 if(value===null||value===undefined)return null;
 if(typeof value==="string"){
  const clean=short(value);
  if(!clean)return null;
  if(/(?:https?:\/\/|s3:\/\/|r2:\/\/|data:)/i.test(clean))
   return "Link on file";
  return clean;
 }
 if(typeof value==="number")return Number.isFinite(value)?String(value):null;
 if(typeof value==="boolean")return value?"Yes":"No";
 if(Array.isArray(value))return value.length?String(value.length)+" entries":null;
 if(record(value))return Object.keys(value).length?"Details on file":null;
 return null;
}

/** A bounded UI projection: no raw JSON dump, no private object URLs or identifiers. */
export function projectAdminLearnerProfileSections(raw:unknown):AdminLearnerProfileSection[]{
 const doc=record(raw)?raw:{};
 return ADMIN_LEARNER_PROFILE_SECTIONS.map(([key,label])=>{
  const value=doc[key];
  if(!present(value))return {key,label,present:false,entries:[]};
  if(privateSections.has(key))
   return {key,label,present:true,entries:[{label:"Status",value:"Recorded — use the authorized document or profile workflow to view details"}]};
  const rows: {label:string;value:string}[]=[];
  const add=(entryLabel:string,entryValue:unknown)=>{
   if(rows.length>=40||restrictedField.test(entryLabel))return;
   const safe=describe(entryValue);
   if(safe!==null)rows.push({label:labelField(entryLabel),value:safe});
  };
  if(Array.isArray(value)){
   for(const [i,item] of value.slice(0,20).entries()){
    if(record(item)){
     for(const [field,fieldValue] of Object.entries(item).slice(0,20))
      add((i+1)+". "+field,fieldValue);
    }else add("Entry "+(i+1),item);
   }
   if(value.length>20)add("Additional entries",value.length-20);
  }else if(record(value)){
   for(const [field,fieldValue] of Object.entries(value).slice(0,50))
    add(field,fieldValue);
  }else add("Value",value);
  return {key,label,present:true,entries:rows};
 });
}
