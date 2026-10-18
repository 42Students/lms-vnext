/** Global template lifecycle controls must reflect mutations the service
 * actually permits. Archived templates are immutable; duplicate them to
 * create a separate draft instead of advertising a failing republish action. */
export function projectTemplateGlobalActions(status:string){
  return {
    canPublish:status==="DRAFT",
    canUnpublish:status==="PUBLISHED",
    canDuplicate:status==="DRAFT"||status==="PUBLISHED"||status==="ARCHIVED",
    canArchive:status==="DRAFT"||status==="PUBLISHED",
  };
}
