/** Project-subject events never fall back to an untrusted metadata project ID. */
export function resolveMentorActivityProjectId(
 row:{subjectType:string;subjectId:string;metadataProjectId:string|null},
 allowed:ReadonlySet<string>,
):string|null {
 const projectId=row.subjectType==="project"?row.subjectId:row.metadataProjectId;
 return projectId&&allowed.has(projectId)?projectId:null;
}
