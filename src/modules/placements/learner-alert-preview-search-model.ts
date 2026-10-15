/** This is deliberately limited to already authorized and fetched personal alerts.
 * Never describe the result as a search across the entire notification history. */
export function searchLearnerAlertPreview<T extends {title:string;body:string}>(
 alerts:readonly T[],query:string
):T[]{
 const normalize=(s:string)=>s.trim().replace(/\s+/gu," ").toLocaleLowerCase("en");
 const needle=normalize(query);
 return !needle?[...alerts]:alerts.filter(alert=>
  normalize(alert.title).includes(needle)||normalize(alert.body).includes(needle));
}
