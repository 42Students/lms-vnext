/** All round navigation stays within the actual parent job; no cross-tenant URL is inferred. */
export function tpoDriveDayRoundLinks(jobId:string,roundId:string){
 const job="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return {
  results:job+"/rounds/"+encodeURIComponent(roundId)+"/results",
  schedule:job+"/candidate-schedule",
  noShows:"/tpo/drive-day/"+encodeURIComponent(roundId)+"/no-shows",
 };
}
