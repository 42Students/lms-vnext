/** Do not reflect arbitrary server error payloads, stack data, or
 * authorization internals into the learner's offer action toast. */
export function learnerOfferActionErrorMessage(
 status:number,
 code?:string | null,
 currentStatus?:string | null,
):string{
 // Render only fixed, public offer-state names; never interpolate an arbitrary server message.
 const knownStatus = currentStatus && ["ISSUED","ACCEPTED","DECLINED","EXPIRED","WITHDRAWN"].includes(currentStatus) ? currentStatus : null;
 if(status===409||status===410||status===422){
  if(code==="PLACEMENT_OFFER_ACTIVE_EXISTS")
   return "You already have another accepted offer. Ask the placement cell to review your options.";
  if(code==="PLACEMENT_OFFER_CONFLICT" || code==="PLACEMENT_OFFER_STALE")
   return "This offer was modified by someone else. Refresh the page and try again.";
  if(code==="PLACEMENT_OFFER_EXPIRED")
   return "The offer response deadline has passed. Refresh the page to review its status.";
  if(code==="PLACEMENT_OFFER_INVALID_TRANSITION" && knownStatus)
   return "This offer can no longer be responded to. Refresh the page to review its status.";
  if(code==="PLACEMENT_OFFER_INVALID_TRANSITION")
   return "This offer can no longer be responded to. Refresh the page to review its current status.";
  return "This offer may have changed or expired. Refresh the page and review its current status.";
 }
 if(status===404 && code==="PLACEMENT_OFFER_NOT_FOUND")
  return "Offer not found. Refresh the page to see your current offers.";
 if(status===401)return "Your session expired. Sign in again, then return to My offers.";
 if(status===403)return "Only learners can respond to their own offers. Switch to your learner workspace.";
 if(status===404)return "Offer not found. Return to My offers and refresh the list.";
 return "Could not record the offer response. No change is confirmed; please retry.";
}
