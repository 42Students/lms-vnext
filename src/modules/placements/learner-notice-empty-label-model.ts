/** Empty states do not infer absence of a separate placement-only publisher. */
export function learnerNoticeEmptyLabel(
 authorizedTotal:number,pinnedOnly:boolean,source:"all"|"placement-cell",
 options:{search?:string;recent?:boolean;matchingTotal?:number}={},
):string{
 if(authorizedTotal===0)return "No announcements from your placement cell yet.";
 if(source==="placement-cell")
  return authorizedTotal===0
   ?"No announcements from your placement cell yet."
   :"No announcements from your placement cell match these filters. Try all notices.";
 if(pinnedOnly&&authorizedTotal>0)return "No pinned college notices match the selected filters.";
 if(options.search?.trim())return "No loaded college notices match this search and the selected filters.";
 if(options.recent)return "No college notices match the last 30 days and selected filters.";
 return "No current college notices match the filters or are visible to your membership.";
}
