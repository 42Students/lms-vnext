/** Match the file/document placeholder exception in resource validation.
 * Creating metadata is not equivalent to uploading or sharing file bytes.
 */
export type MentorResourceEntryType=
  "FILE"|"LINK"|"DOCUMENT"|"CODE"|"NOTE"|"ENVIRONMENT"|
  "PDF"|"DOC"|"PPT"|"VIDEO"|"";
const FILE_KINDS:readonly string[]=["FILE","DOCUMENT","PDF","DOC","PPT","VIDEO"];
export function canSaveMentorResourceEntry(input:{
  type:MentorResourceEntryType;description:string;url:string;
  isLearner?:boolean;
}):boolean{
  if(input.description.trim()||input.url.trim())return true;
  return !input.isLearner&&FILE_KINDS.includes(input.type);
}
export function mentorResourceEffectiveStatus(input:{
  type:MentorResourceEntryType;description:string;url:string;
  selectedStatus:"ACTIVE"|"DRAFT"|"ARCHIVED";
}):"ACTIVE"|"DRAFT"|"ARCHIVED"{
  if(!input.description.trim()&&!input.url.trim()&&FILE_KINDS.includes(input.type))
    return "DRAFT";
  return input.selectedStatus;
}
