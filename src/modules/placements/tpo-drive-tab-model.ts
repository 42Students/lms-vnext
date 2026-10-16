export type TpoDriveTab={label:string;href:string};
export function tpoDriveTabs(jobId:string):TpoDriveTab[]{
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return [
  {label:"Overview",href:root},
  {label:"Applicants",href:root+"/applicants"},
  {label:"Pipeline",href:root+"/applicants-pipeline"},
  {label:"Candidate schedule",href:root+"/candidate-schedule"},
  {label:"Drive day",href:root+"/drive-day"},
  {label:"Rounds",href:root+"/rounds"},
  {label:"Selections",href:root+"/selections"},
  {label:"Offers",href:root+"/offers"},
  {label:"Waitlist",href:root+"/waitlist"},
  {label:"Joining",href:root+"/joining"},
  {label:"Change requests",href:root+"/change-requests"},
  {label:"Company sharing",href:root+"/share-preview"},
 ];
}
