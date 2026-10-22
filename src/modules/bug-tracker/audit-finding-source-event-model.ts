/** Preserve legacy sync provenance without rewriting the historical actor.
 * The DB10 events table currently allows COMMENT as a persisted action; the
 * specific immutable file event is stored separately in toValue.sourceEvent.
 * Do not conflate a source-file receipt with an approved finding STATUS edit. */
export const auditFindingSourceEventLabels = {
 imported: "Reported",
 agent_update: "Agent update",
 file_changed: "File changed",
 file_deleted: "File deleted",
} as const;

export type AuditFindingSourceEventType = keyof typeof auditFindingSourceEventLabels;

export function classifyAuditFindingSourceEvent(
 action: "IMPORT" | "UPDATE" | "DELETE",
 result: "ACCEPTED" | "TAMPERED" | "DELETED" | "REFUSED",
): AuditFindingSourceEventType | null {
 if (result === "TAMPERED") return "file_changed";
 if (result === "DELETED") return "file_deleted";
 if (result === "ACCEPTED") return action === "UPDATE" ? "agent_update" : "imported";
 return null;
}

export function auditFindingHistoryActionLabel(action: string, toValue: unknown): string {
 if (toValue && typeof toValue === "object" && "sourceEvent" in toValue) {
  const kind = toValue.sourceEvent;
  if (typeof kind === "string" && Object.prototype.hasOwnProperty.call(auditFindingSourceEventLabels, kind)) {
   return auditFindingSourceEventLabels[kind as AuditFindingSourceEventType];
  }
 }
 return action;
}
