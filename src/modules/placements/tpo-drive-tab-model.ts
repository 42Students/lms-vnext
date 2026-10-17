export type TpoDriveTab={label:string;href:string};

/** Primary workspace tabs, including persisted drive-scoped recruiter threads. */
export function tpoDriveTabs(jobId:string):TpoDriveTab[]{
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return [
  {label:"Overview",href:root},
  {label:"Applicants",href:root+"/applicants-pipeline"},
  {label:"Rounds",href:root+"/rounds"},
  {label:"Offers",href:root+"/offers"},
  {label:"Drive day",href:root+"/drive-day"},
  {label:"Discussion",href:root+"/discussion"},
  {label:"About this drive",href:root+"/about"},
 ];
}

/** Secondary workflows remain accessible without crowding the tab strip. */
export function tpoDriveMoreTabs(jobId:string):TpoDriveTab[]{
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return [
  {label:"Activity",href:root+"/about#activity"},
  {label:"Candidate schedule",href:root+"/candidate-schedule"},
  {label:"Selections",href:root+"/selections"},
  {label:"Waitlist",href:root+"/waitlist"},
  {label:"Joining",href:root+"/joining"},
  {label:"Change requests",href:root+"/change-requests"},
  {label:"Company sharing",href:root+"/share-preview"},
 ];
}

/** Old Overview and Applicants deep links stay routable. */
export function tpoDriveTabHref(jobId:string,tab:string){
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const routes:Record<string,string>={
  overview:root,applicants:root+"/applicants-pipeline",rounds:root+"/rounds",
  offers:root+"/offers","drive-day":root+"/drive-day",
  about:root+"/about",discussion:root+"/discussion",
 };
 return routes[tab]??root;
}
