/** SA-placements-projects-115: the diagnostic clipboard must never include raw
 * Cloud Logging payloads, stack traces, tokens, account identifiers or URLs. */
export type KnownErrorSafeSummaryInput={
  signatureHash:string;
  environment:string;
  fixStatus:string;
  occurrences:string;
  affectedAccounts:number|null;
  firstSeen:string;
  lastSeen:string;
  issuePublicId:string|null;
};
export function knownErrorSafeSummary(input:KnownErrorSafeSummaryInput):string {
 const safe=(value:string,max=96)=>value.replace(/[^a-zA-Z0-9_:. -]/g,"").slice(0,max);
 const hash=/^[0-9a-f]{16,128}$/i.test(input.signatureHash)?input.signatureHash:"unavailable";
 const count=/^\d{1,20}$/.test(input.occurrences)?input.occurrences:"unknown";
 return [
  "Known error triage (sanitized; no raw logs)",
  "Signature: "+hash,
  "Environment: "+safe(input.environment,32),
  "State: "+safe(input.fixStatus,32),
  "Occurrences: "+count,
  "Affected accounts (count only): "+(input.affectedAccounts===null?"unknown":Math.max(0,Math.floor(input.affectedAccounts))),
  "First seen (IST): "+safe(input.firstSeen),
  "Last seen (IST): "+safe(input.lastSeen),
  "Linked issue: "+(input.issuePublicId?safe(input.issuePublicId,32):"none"),
  "Investigate via authorized logging tools; do not paste production logs or account data.",
 ].join("\n");
}


/** SA-placements-projects-115: administrator clipboard read-only inspection.
 * SQL is limited to aggregate triage state, never sample_message, sample_path,
 * account-key hashes, raw logging tables, or dynamic identifiers.
 * Strict validation prevents malicious fragments from entering executable SQL.
 */
export function knownErrorSafeSql(input:{signatureHash:string;environment:string}):string|null {
  const hash=input.signatureHash.trim().toLowerCase();
  const environment=input.environment.trim();
  if(!/^[a-f0-9]{64}$/.test(hash)||!/^[a-zA-Z0-9_-]{1,32}$/.test(environment))return null;
  return [
    "-- Read-only aggregate triage; authorized administrators only.",
    "SELECT environment, signature_hash, occurrence_count, first_seen_at, last_seen_at,",
    "       fix_status, muted, issue_public_id",
    "FROM log_alert_signatures",
    "WHERE environment = '"+environment+"'",
    "  AND signature_hash = '"+hash+"'",
    "LIMIT 1;",
  ].join("\n");
}
