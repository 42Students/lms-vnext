export type TpoDriveTab={label:string;href:string;count?:number};
export type TpoDriveTabCounts={applicants?:number;rounds?:number;offers?:number};
const labelWithCount=(label:string,count:number|undefined)=>
 count===undefined?label:label+" ("+count+")";

/** Six legacy primary tabs, with distinct routed pages and optional authorized counts. */
export function tpoDriveTabs(jobId:string,counts:TpoDriveTabCounts={}):TpoDriveTab[]{
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return [
  {label:labelWithCount("Applicants",counts.applicants),href:root+"/applicants-pipeline",count:counts.applicants},
  {label:labelWithCount("Rounds",counts.rounds),href:root+"/rounds",count:counts.rounds},
  {label:labelWithCount("Offers",counts.offers),href:root+"/offers",count:counts.offers},
  {label:"Drive day",href:root+"/drive-day"},
  {label:"Discussion",href:root+"/discussion"},
  {label:"About this drive",href:root+"/about"},
 ];
}

/** Exact six old-LMS inner tabs, in their original order. New vNext Overview
 * remains the workspace landing route; UI owners can render this six-tab
 * strip without losing the seven-entry primary navigation contract. */
export function tpoDriveLegacyInnerTabs(jobId:string,counts:TpoDriveTabCounts={}):TpoDriveTab[]{
 return tpoDriveTabs(jobId,counts);
}

/** Secondary workflows remain accessible without crowding the tab strip. */
export function tpoDriveMoreTabs(jobId:string):TpoDriveTab[]{
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 return [
  {label:"Overview",href:root},
  {label:"Activity",href:root+"/about#activity"},
  {label:"Candidate schedule",href:root+"/candidate-schedule"},
  {label:"Selections",href:root+"/selections"},
  {label:"Waitlist",href:root+"/waitlist"},
  {label:"Joining",href:root+"/joining"},
  {label:"Change requests",href:root+"/change-requests#new"},
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
