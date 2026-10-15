/** Empty states do not infer absence of a separate placement-only publisher. */
export function learnerNoticeEmptyLabel(
 authorizedTotal:number,pinnedOnly:boolean,source:"all"|"placement-cell",
 options:{search?:string;recent?:boolean;matchingTotal?:number}={},
):string{
 if(authorizedTotal===0)return "No currently visible college notices have been published to your membership.";
 if(source==="placement-cell")
  return "No placement-cell authored college notices match these filters or are currently visible to your membership.";
 if(pinnedOnly&&authorizedTotal>0)return "No pinned college notices match the selected filters.";
 if(options.search?.trim())return "No loaded college notices match this search and the selected filters.";
 if(options.recent)return "No college notices match the last 30 days and selected filters.";
 return "No current college notices match the filters or are visible to your membership.";
}
