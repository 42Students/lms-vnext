export type TpoLiveTriageCounts={total:number;checkedIn:number;noShow:number;pending:number;unknown:number};
export function summarizeTpoLiveTriage(rows:readonly {counts:TpoLiveTriageCounts}[]){
 return rows.reduce((acc,row)=>({
  rounds:acc.rounds+1,
  roster:acc.roster+row.counts.total,
  checkedIn:acc.checkedIn+row.counts.checkedIn,
  explicitNoShows:acc.explicitNoShows+row.counts.noShow,
  pending:acc.pending+row.counts.pending,
  unrecorded:acc.unrecorded+row.counts.unknown,
 }),{rounds:0,roster:0,checkedIn:0,explicitNoShows:0,pending:0,unrecorded:0});
}
