import { z } from "zod";
import type { FacultyProfileDocument } from "./faculty-profile-document";

export function facultyMetadataEditableKey(key:string):boolean {
 return key.length>0 && key.length<=120 && key===key.trim() &&
  !["__proto__","constructor","prototype"].includes(key.toLowerCase()) &&
  !/(?:password|secret|token|aadhaar|aadhar|pan.?number|identity|otp)/i.test(key);
}

const entrySchema=z.object({
 id:z.string().uuid(),
 key:z.string().trim().min(1).max(120)
   .refine(facultyMetadataEditableKey,
     "Identity and secret fields are not profile metadata"),
 value:z.string().max(5000),
}).strict();
export type FacultyMetadataDraftEntry=z.infer<typeof entrySchema>;

/** Replace only editable text metadata; retain legacy typed values without coercion. */
export function facultyMetadataFromDraft(
 current:FacultyProfileDocument["metadata"], raw:unknown,
):FacultyProfileDocument["metadata"]{
 const entries=z.array(entrySchema).max(100).parse(raw);
 const next:{[key:string]:string|number|boolean|null}={};
 for(const [key,value] of Object.entries(current)){
  if(typeof value!=="string" || !facultyMetadataEditableKey(key))next[key]=value;
 }
 const seen=new Set<string>();
 for(const entry of entries){
  const key=entry.key.trim();
  if(seen.has(key)||Object.hasOwn(next,key))
   throw new Error("Duplicate or protected metadata key");
  seen.add(key);
  next[key]=entry.value;
 }
 return next;
}
