/** SA-placements-projects-115: the diagnostic clipboard must never include raw
 * Cloud Logging payloads, stack traces, tokens, account identifiers or URLs. */
export type KnownErrorSafeSummaryInput={
  signatureHash:string;
  environment:string;
  fixStatus:string;
  occurrences:string;
  affectedAccounts:number;
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
  "Affected accounts (count only): "+Math.max(0,Math.floor(input.affectedAccounts)),
  "First seen (IST): "+safe(input.firstSeen),
  "Last seen (IST): "+safe(input.lastSeen),
  "Linked issue: "+(input.issuePublicId?safe(input.issuePublicId,32):"none"),
  "Investigate via authorized logging tools; do not paste production logs or account data.",
 ].join("\n");
}
