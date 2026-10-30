/** Thin compatibility links for saved old-LMS TPO drive URLs.
 * The canonical pages own authentication, tenant checks and the real UI.
 * Never duplicate a placement service or authorize a drive from its URL.
 */
export type LegacyTpoDriveQuery = Record<string,string|string[]|undefined>;
const listPath="/tpo/placements/lifecycle";
const createPath="/tpo/placements/new";
const detailRoot=(jobId:string)=>"/tpo/placements/jobs/"+encodeURIComponent(jobId);

const single=(value:string|string[]|undefined,max=100)=>
 typeof value==="string"&&value.length<=max?value:undefined;
const withQuery=(path:string,params:URLSearchParams)=>
 path+(params.size?"?"+params.toString():"");
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const legacyListTabs=new Set(["requests","drafts","live","closed"]);
const legacyDriveTabs:Record<string,string>={
 applicants:"applicants",students:"applicants",rounds:"rounds",
 driveday:"rounds",offers:"offers",talk:"discussion",
 discussion:"discussion",about:"about",overview:"about",
 "drive-day":"drive-day",
};

/** Retain the legacy list tab, keyword and paged position.
 * Unmapped f_* filters are deliberately NOT reinterpreted as college IDs.
 */
export function legacyTpoDrivesListHref(query:LegacyTpoDriveQuery={}):string{
 const params=new URLSearchParams();
 const tab=single(query.tab)?.toLowerCase();
 if(tab&&legacyListTabs.has(tab))params.set("tab",tab);
 const search=single(query.q)??single(query.search);
 if(search)params.set("search",search);
 const page=single(query.page,5);
 if(page&&/^[1-9][0-9]{0,3}$/.test(page))params.set("page",page);
 const request=single(query.request,36);
 if(request&&uuid.test(request)&&(!tab||tab==="requests")){
  // A saved direct request link must open the Requests view, even when
  // Live would otherwise be the canonical list's default.
  if(!tab)params.set("tab","requests");
  params.set("request",request);
 }
 return withQuery(listPath,params);
}

/** Keep the company prefill only; malformed/repeated values reach the
 * canonical create page's existing visible validation warning.
 */
export function legacyTpoNewDriveHref(query:LegacyTpoDriveQuery={}):string{
 const params=new URLSearchParams();
 const company=query.company;
 if(typeof company==="string")params.set("company",company.slice(0,151));
 else if(Array.isArray(company)){
  for(const value of company.slice(0,2))params.append("company",value.slice(0,151));
 }
 return withQuery(createPath,params);
}

/** Legacy inner-tab aliases and #round links resolve through the canonical
 * job router, which must authorize and read the persisted job first.
 */
export function legacyTpoDriveDetailHref(jobId:string,query:LegacyTpoDriveQuery={}):string{
 const root=detailRoot(jobId);
 const requested=single(query.tab)?.trim().toLowerCase();
 const tab=requested?legacyDriveTabs[requested]:undefined;
 if(single(query.show)==="not-applied"&&(!tab||tab==="applicants"))
  return root+"/not-applied";
 const params=new URLSearchParams();
 if(tab){
  params.set("tab",tab);
  const roundId=single(query.roundId,36);
  if(tab==="rounds"&&roundId&&uuid.test(roundId))params.set("roundId",roundId);
 }else if(single(query.publish)==="1"){
  params.set("publish","1");
 }
 return withQuery(root,params);
}

export function legacyTpoDriveEditHref(jobId:string):string{
 return detailRoot(jobId)+"/edit";
}
