export function hrTeamRosterMessage(
 all:readonly {isYou:boolean}[],matching:number,query:string,pageItems:number
):string|null{
 if(all.length===0)return "No active teammates are recorded for this employer and college.";
 if(matching===0)return query.trim()?
  "No authorized teammates match this search. Clear the search to see the team.":
  "No teammates are available in this view.";
 if(pageItems===0)return "No teammates on this page. Return to an earlier page.";
 if(all.length===1&&all[0]?.isYou&&!query.trim())
  return "Only you so far. Additional colleagues will appear when they have active recruiter access.";
 return null;
}
