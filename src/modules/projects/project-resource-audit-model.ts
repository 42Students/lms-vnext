/** COL-projects-18: distinguish documented resource mutations from other Project activity. */
export type ProjectResourceAuditAction = "Added" | "Edited" | "Saved" | "Removed";
export function projectResourceAuditAction(eventType: string): ProjectResourceAuditAction | null {
 const value=eventType.toLowerCase().replaceAll("_",".");
 if (!value.includes(".resource.")) return null;
 if (value.endsWith(".created")||value.endsWith(".added")) return "Added";
 if (value.endsWith(".archived")||value.endsWith(".deleted")||value.endsWith(".removed")) return "Removed";
 if (value.endsWith(".updated")||value.endsWith(".edited")) return "Edited";
 if (value.endsWith(".saved")) return "Saved";
 return null;
}
export function projectResourceAuditMatches(eventType:string,filter:string): boolean {
 const action=projectResourceAuditAction(eventType);
 return filter === "ALL" ? true : filter === "RESOURCES" ? action!==null : action===filter;
}
