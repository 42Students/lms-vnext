/** COL-projects-18: distinguish documented resource mutations from other Project activity. */
export type ProjectResourceAuditAction = "Added" | "Edited" | "Saved" | "Removed" | (string & {});
export function projectResourceAuditAction(eventType: string): ProjectResourceAuditAction | null {
 const value=eventType.toLowerCase().replaceAll("_",".");
 if (!value.includes(".resource.")) return null;
 if (value.endsWith(".created")||value.endsWith(".added")||value.endsWith(".create")) return "Added";
 if (value.endsWith(".archived")||value.endsWith(".deleted")||value.endsWith(".removed")||value.endsWith(".delete")) return "Removed";
 if (value.endsWith(".updated")||value.endsWith(".edited")||value.endsWith(".update")) return "Edited";
 if (value.endsWith(".saved")||value.endsWith(".upsert")) return "Saved";
 // Historical resource audits sometimes contain actions added by a new
 // producer. Keep their original action key rather than dropping the row.
 const raw=eventType.slice(eventType.lastIndexOf(".")+1).trim();
 return raw.slice(0,80)||"Unknown";
}
export function projectResourceAuditMatches(eventType:string,filter:string): boolean {
 const action=projectResourceAuditAction(eventType);
 return filter === "ALL" ? true : filter === "RESOURCES" ? action!==null : action===filter;
}
