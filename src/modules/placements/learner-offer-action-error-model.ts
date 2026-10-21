/** Do not reflect arbitrary server error payloads, stack data, or
 * authorization internals into the learner's offer action toast. */
export function learnerOfferActionErrorMessage(
 status:number,
 code?:string | null,
 currentStatus?:string | null,
):string{
 // Render only fixed, public offer-state names; never interpolate an arbitrary server message.
 const safeStatus = currentStatus?.toUpperCase();
 const knownStatus = safeStatus && ["ISSUED","RELEASED","ACCEPTED","DECLINED","EXPIRED","WITHDRAWN","CANCELLED"].includes(safeStatus)
  ? safeStatus : null;
 if(status===409||status===410||status===422){
  if(code==="PLACEMENT_OFFER_EXPIRED")
   return "The offer response deadline has passed. Refresh the page to review its status.";
  if(code==="PLACEMENT_OFFER_INVALID_TRANSITION" && knownStatus)
   return `This offer can no longer be responded to (current status: ${knownStatus}). Refresh the page.`;
  if(code==="PLACEMENT_OFFER_INVALID_TRANSITION")
   return "This offer can no longer be responded to. Refresh the page to review its current status.";
  return "This offer may have changed or expired. Refresh the page and review its current status.";
 }
 if(status===404 && code==="PLACEMENT_OFFER_NOT_FOUND")
  return "Offer not found. Refresh the page to see your current offers.";
 if(status===401||status===403||status===404)
  return "You cannot update this offer in your current account. Refresh or contact your placement team.";
 return "Could not record the offer response. No change is confirmed; please retry.";
}
