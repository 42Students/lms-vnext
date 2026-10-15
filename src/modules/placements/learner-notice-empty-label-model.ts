/** Empty states do not infer absence of a separate placement-only publisher. */
export function learnerNoticeEmptyLabel(authorizedTotal:number,pinnedOnly:boolean,source:"all"|"placement-cell"):string{
 if(source==="placement-cell")
  return "No placement-cell authored college notices match these filters or are currently visible to your membership.";
 if(pinnedOnly&&authorizedTotal>0)return "No pinned college notices match the selected filters.";
 return "No current college notices match the filters or are visible to your membership.";
}
