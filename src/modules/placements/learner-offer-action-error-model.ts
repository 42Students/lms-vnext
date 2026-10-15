/** Do not reflect arbitrary server error payloads, stack data, or
 * authorization internals into the learner's offer action toast. */
export function learnerOfferActionErrorMessage(status:number):string{
 if(status===409||status===410||status===422)
  return "This offer may have changed or expired. Refresh the page and review its current status.";
 if(status===401||status===403||status===404)
  return "You cannot update this offer in your current account. Refresh or contact your placement team.";
 return "Could not record the offer response. No change is confirmed; please retry.";
}
