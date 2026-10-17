import {normalizeAssignmentMethods,type AssignmentMethod} from "./assignment-submission-methods";

export type SubmittedPart={kind:"TEXT"|"LINK"|"FILE";fileMimeTypes?:readonly string[];linkKind?:"REPOSITORY_LINK"|"EXTERNAL_LINK"};
export function allowedAssignmentSubmissionPart(
 methodsRaw:unknown,part:SubmittedPart,
):boolean{
 const methods=new Set(normalizeAssignmentMethods(methodsRaw));
 if(part.kind==="TEXT")return methods.has("WRITTEN_RESPONSE");
 if(part.kind==="LINK")return part.linkKind?methods.has(part.linkKind):
  // Old clients omit linkKind. They must not bypass a narrowed policy:
  // accept unspecified kind only when both link methods are allowed.
  methods.has("REPOSITORY_LINK")&&methods.has("EXTERNAL_LINK");
 const allowedAny=methods.has("FILE_UPLOAD"),pdfOnly=methods.has("PDF_UPLOAD");
 if(!allowedAny&&!pdfOnly)return false;
 if(!allowedAny && (part.fileMimeTypes??[]).some(mime=>mime!=="application/pdf"))return false;
 return true;
}
export function allowedAssignmentMixedParts(methods:unknown,{
 hasWrittenResponse,links,fileMimeTypes,
}:{
 hasWrittenResponse:boolean;
 links:readonly {kind:"REPOSITORY_LINK"|"EXTERNAL_LINK"}[];
 fileMimeTypes:readonly string[];
}):boolean{
 const allowed=new Set<AssignmentMethod>(normalizeAssignmentMethods(methods));
 if(hasWrittenResponse&&!allowed.has("WRITTEN_RESPONSE"))return false;
 if(links.some(link=>!allowed.has(link.kind)))return false;
 if(fileMimeTypes.length===0){
  // A multipart submission may combine text and repository/website links
  // without requiring a fabricated file; the caller enforces nonempty parts.
  return hasWrittenResponse || links.length>0;
 }
 return allowedAssignmentSubmissionPart(methods,{kind:"FILE",fileMimeTypes});
}
