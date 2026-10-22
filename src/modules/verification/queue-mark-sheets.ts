import type {SafeSnapshot} from "@/modules/profile-verification/domain";
export function submittedMarksheets(snapshot:SafeSnapshot):{count:number;missing:number}{
 const education=snapshot["education"];
 if(!Array.isArray(education))return {count:0,missing:0};
 let count=0,missing=0;
 for(const entry of education){
  if(!entry||typeof entry!=="object"||Array.isArray(entry))continue;
  count++;
  if(typeof entry["marksheetDocumentId"]!=="string"||!entry["marksheetDocumentId"])missing++;
 }
 return {count,missing};
}
