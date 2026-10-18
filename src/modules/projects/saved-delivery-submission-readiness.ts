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
  // Do not call a forged/partially uploaded file "evidence": the persisted
  // submission service requires a concrete UUID and a READY project file.
  const fileEvidence=Array.isArray(value.attachments)&&
    value.attachments.some(item=>{
      if(!item||typeof item!=="object"||Array.isArray(item))return false;
      const file=item as {kind?:unknown;fileId?:unknown;url?:unknown};
      return file.kind==="FILE"&&typeof file.fileId==="string"&&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(file.fileId)&&
        file.url==null;
    });
  const safeUrl=(url:unknown)=>{
    if(typeof url!=="string")return false;
    try{
      const parsed=new URL(url);
      return (parsed.protocol==="https:"||parsed.protocol==="http:")&&Boolean(parsed.hostname);
    }catch{return false;}
  };
  return (safeUrl(value.sourceUrl)||safeUrl(value.demoUrl)||fileEvidence)
    ? "READY" : "MISSING_EVIDENCE";
}
