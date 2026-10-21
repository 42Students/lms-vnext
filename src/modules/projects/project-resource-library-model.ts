import { z } from "zod";

/** Legacy resource labels are retained separately from the normalized vNext
 * type so PDF/DOC/PPT/Video/File do not silently collapse during editing.
 */
export const legacyResourceKinds = [
  "Link","PDF","DOC","PPT","Video","File","Code","Note","Environment",
] as const;
export type LegacyResourceKind = typeof legacyResourceKinds[number];
export function normalizedResourceKind(kind:LegacyResourceKind){
  return kind==="Link"?"LINK" as const:
    ["PDF","DOC","PPT"].includes(kind)?"DOCUMENT" as const:
    kind==="Video"||kind==="File"?"FILE" as const:
    kind==="Code"?"CODE" as const:
    kind==="Environment"?"ENVIRONMENT" as const:"NOTE" as const;
}
export function legacyResourceKind(value:string|null|undefined,type:string):LegacyResourceKind {
  if(value){
    const exact=legacyResourceKinds.find(kind=>kind.toLowerCase()===value.toLowerCase());
    if(exact)return exact;
  }
  switch(type){
    case "FILE":return "File";
    case "DOCUMENT":return "DOC";
    case "CODE":return "Code";
    case "NOTE":return "Note";
    case "ENVIRONMENT":return "Environment";
    default:return "Link";
  }
}
export function makeResourceKey(title:string){
  const key=title.normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
    .replace(/^-|-$/g,"").slice(0,120).replace(/-$/g,"");
  return key||"resource";
}
const safeUrl=z.string().trim().max(2048).url()
  .refine(url=>/^https?:\/\//i.test(url),{message:"Only HTTP(S) resource URLs are allowed"});
export const projectResourceLibraryRowSchema=z.strictObject({
  id:z.string().uuid().nullable(),
  key:z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title:z.string().trim().min(1,"Title is required").max(200),
  legacyKind:z.enum(legacyResourceKinds),
  url:safeUrl.nullable(),
  description:z.string().trim().max(4000).nullable(),
  accessNotes:z.string().trim().max(4000).nullable(),
  pinned:z.boolean(),
  required:z.boolean(),
  visibility:z.enum(["TEAM","MENTOR_ONLY"]),
  status:z.enum(["ACTIVE","DRAFT","ARCHIVED"]),
});
export type ProjectResourceLibraryRow=z.infer<typeof projectResourceLibraryRowSchema>;
export const projectResourceLibrarySaveSchema=z.strictObject({
  expectedToken:z.string().regex(/^[a-f0-9]{64}$/),
  rows:z.array(projectResourceLibraryRowSchema).max(500),
}).superRefine((input,ctx)=>{
  const ids=new Set<string>();
  const keys=new Set<string>();
  input.rows.forEach((row,i)=>{
    if(row.id){
      if(ids.has(row.id))ctx.addIssue({code:"custom",path:["rows",i,"id"],message:"Duplicate resource"});
      ids.add(row.id);
    }
    const key=row.key.toLowerCase();
    if(keys.has(key))ctx.addIssue({code:"custom",path:["rows",i,"key"],message:"Duplicate resource key"});
    keys.add(key);
  });
});
