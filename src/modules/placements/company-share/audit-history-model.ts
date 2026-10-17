export type CompanyShareAuditEntry={shareId:string;eventKind:string;occurredAt:Date};
export function projectCompanyShareAudit(entries:readonly CompanyShareAuditEntry[]){
 return entries.map(event=>({
  sharePrefix:event.shareId.slice(0,8),
  kind:event.eventKind==="CSV"?"CSV download":event.eventKind==="LOCKED"?"Locked after wrong codes":"Page view",
  at:event.occurredAt.toISOString(),
 }));
}
