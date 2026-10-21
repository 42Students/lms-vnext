/** One materialization contract for regular, class-team and template-replacement
 * workspaces. The database has a restricted canonical type enum; the original
 * format remains in legacyResourceKind so round-trips never erase PDF/PPT/Video.
 */
export function templateResourceMaterializationFields(source:{
 type?:"LINK"|"PDF"|"DOCUMENT"|"SLIDES"|"VIDEO"|"FILE";
 status?:"ACTIVE"|"DRAFT"|"ARCHIVED";
 pinned?:boolean;accessNotes?:string;
}){
 const raw=source.type??"LINK";
 const resourceType=raw==="PDF"?"FILE":raw==="SLIDES"?"DOCUMENT":
  raw==="VIDEO"?"LINK":raw;
 const legacyResourceKind=raw==="PDF"?"PDF":raw==="SLIDES"?"PPT":
  raw==="VIDEO"?"VIDEO":null;
 return {
  resourceType,
  legacyResourceKind,
  status:source.status??"ACTIVE",
  pinned:source.pinned??false,
  accessNotes:source.accessNotes??null,
 };
}
