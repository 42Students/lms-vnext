import {facultyMetadataEditableKey,facultyMetadataFromDraft,type FacultyMetadataDraftEntry} from "./faculty-profile-metadata-model";
import {facultyContactEditSchema,facultyProfileDocumentSchema,type FacultyProfileDocument} from "./faculty-profile-document";
import type {FacultySelfSection} from "./faculty-self-section-model";
/** Restore exactly the persisted text draft after an explicit discard. */
export function restoreFacultyTextDraft(snapshot:Readonly<Record<string,string>>):Record<string,string>{
 return {...snapshot};
}

/** Restore skill drafts with fresh object identities after explicit consent. */
export function restoreFacultySkills<T extends {id:string}>(saved:readonly T[]):T[]{
 return saved.map(row=>({...row}));
}

/** Rebuild only editable textual metadata while retaining protected typed values at save. */
export function restoreFacultyMetadataDraft(
 saved:FacultyProfileDocument["metadata"],newId:()=>string,
):FacultyMetadataDraftEntry[]{
 return Object.entries(saved)
  .filter((entry):entry is [string,string]=>typeof entry[1]==="string" && facultyMetadataEditableKey(entry[0]))
  .map(([key,value])=>({id:newId(),key,value}));
}

/** Skill removal always identifies one draft record and never changes its snapshot. */
export function removeFacultySkillDraft<T extends {id:string}>(saved:readonly T[],id:string):T[]{
 if(!saved.some(row=>row.id===id))return [...saved];
 return saved.filter(row=>row.id!==id);
}

/** Inline feedback uses the same metadata writer contract, not a parallel heuristic. */
export function facultyMetadataDraftIssue(
 saved:FacultyProfileDocument["metadata"],draft:readonly FacultyMetadataDraftEntry[],
):string|null{
 try{
  facultyMetadataFromDraft(saved,draft);
  return null;
 }catch(error){
  if(error instanceof Error&&error.message==="Duplicate or protected metadata key")
   return "Duplicate or protected metadata key";
  return "Use unique, permitted field names and text within their limits.";
 }
}

/** Validate Faculty-owned text sections against the same Zod document accepted by PATCH. */
export function facultyProfileTextDraftIssue(
 section:FacultySelfSection,draft:Readonly<Record<string,string>>,
 previous:Readonly<Record<string,string>>={},
):string|null{
 if(!["about","personalDetails","contact","address","socialProfiles"].includes(section))
  return "This profile section cannot be edited as text.";
 const parsed=section==="contact" ? facultyContactEditSchema.safeParse(draft)
  : facultyProfileDocumentSchema.safeParse({[section]:draft});
 if(!parsed.success){
  const issue=parsed.error.issues[0];
  const field=section==="contact" ? issue?.path.join(".") : issue?.path.slice(1).join(".");
  return (field?field+": ":"")+(issue?.message??"Review this section.");
 }
 if(section==="socialProfiles")return facultyProfilePublicLinkIssue(previous,draft);
 return null;
}

/** New or changed public social links follow the same HTTPS policy as the write service. */
export function facultyProfilePublicLinkIssue(
 previous:Readonly<Record<string,string>>,next:Readonly<Record<string,string>>,
):string|null{
 for(const [name,value] of Object.entries(next)){
  if(!value||value===previous[name])continue;
  try{
   const url=new URL(value);
   if(url.protocol!=="https:"||!url.hostname||url.username||url.password||
    url.hostname==="localhost"||url.hostname.endsWith(".localhost"))
    return name+" requires an HTTPS URL without credentials or localhost.";
  }catch{return name+" requires a valid HTTPS URL.";}
 }
 return null;
}

/** Skill edits must satisfy the complete profile schema before crossing the write boundary. */
export function facultyProfileSkillsIssue(
 rows:readonly FacultyProfileDocument["skills"][number][],
):string|null{
 const parsed=facultyProfileDocumentSchema.safeParse({skills:rows});
 return parsed.success?null:(parsed.error.issues[0]?.message??"Review Skills.");
}

/** The Skill search affects only visibility, not the complete saved section. */
export function facultyProfileSkillMatches(
 item:{skill:string;proficiency:string},query:string,
):boolean{
 const term=query.trim().toLocaleLowerCase();
 return !term||item.skill.toLocaleLowerCase().includes(term)||
  item.proficiency.toLocaleLowerCase().includes(term);
}

/** Move exactly one Skill without regenerating receipt-independent record IDs. */
export function facultyMoveSkillRecord<T extends {id:string}>(
 rows:readonly T[],id:string,toIndex:number,
):T[]{
 const index=rows.findIndex(row=>row.id===id);
 if(index<0||toIndex<0||toIndex>=rows.length||index===toIndex)return [...rows];
 const next=[...rows];const [item]=next.splice(index,1);next.splice(toIndex,0,item!);
 return next;
}

/** Search displayed editable metadata, never private/typed fields filtered upstream. */
export function facultyProfileMetadataMatches(entry:{key:string;value:string},query:string):boolean{
 const term=query.trim().toLocaleLowerCase();
 return !term||entry.key.toLocaleLowerCase().includes(term)||
  entry.value.toLocaleLowerCase().includes(term);
}

/** Use an exact draft ID for removal even when the visible list is searched. */
export function removeFacultyMetadataDraftEntry<T extends {id:string}>(
 rows:readonly T[],id:string,
):T[]{
 if(!rows.some(entry=>entry.id===id))return [...rows];
 return rows.filter(entry=>entry.id!==id);
}
