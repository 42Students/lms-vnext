/** A learner can submit only the exact draft payload acknowledged by the server.
 * A successful autosave may precede the refresh of React Server Component props.
 * This policy uses the saved snapshot, never the stale initial prop or unsaved inputs.
 */
export type SavedDeliverySubmissionReadiness="READY"|"UNSAVED"|"MISSING_EVIDENCE";
export function savedDeliverySubmissionReadiness(
  currentPayload:unknown,
  lastSavedSnapshot:string,
):SavedDeliverySubmissionReadiness {
  if(JSON.stringify(currentPayload)!==lastSavedSnapshot)return "UNSAVED";
  let saved:unknown;
  try{saved=JSON.parse(lastSavedSnapshot);}
  catch{return "UNSAVED";}
  if(!saved||typeof saved!=="object"||Array.isArray(saved))return "UNSAVED";
  const value=saved as Record<string,unknown>;
  if(typeof value.summary!=="string"||!value.summary.trim())return "MISSING_EVIDENCE";
  const fileEvidence=Array.isArray(value.attachments)&&
    value.attachments.some(item=>item!==null&&typeof item==="object"&&
      !Array.isArray(item)&&(item as {kind?:unknown}).kind==="FILE");
  return Boolean(value.sourceUrl||value.demoUrl||fileEvidence)
    ? "READY" : "MISSING_EVIDENCE";
}
