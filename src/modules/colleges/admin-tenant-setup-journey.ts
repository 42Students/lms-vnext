/** A grouped setup journey, not a readiness verdict. Links are all established Super Admin routes. */
export function superAdminTenantSetupSteps(collegeId:string){
 const prefix=`/admin/colleges/${encodeURIComponent(collegeId)}`;
 return [
  {id:"brand",title:"Branding",description:"Inspect stored brand assets and contact/support links.",href:prefix+"/branding"},
  {id:"login",title:"Sign-in",description:"Review staged college login preferences, without changing authentication.",href:prefix+"/signin"},
  {id:"host",title:"Web address",description:"Verify domains and choose a verified primary host.",href:prefix+"/subdomain"},
  {id:"preview",title:"Host resolution preview",description:"In the global Super Admin scope, preview verified tenant resolution without a DNS lookup.",href:"/admin/tenants/resolve-preview"},
  {id:"academics",title:"Academic setup",description:"Set up departments, programs, semesters and classes.",href:"/admin/academics"},
  {id:"people",title:"Admins & memberships",description:"Review college people and membership roles.",href:"/admin/people"},
  {id:"features",title:"Module controls",description:"Inspect effective Projects, Placements and Electives access.",href:`/admin/features/${encodeURIComponent(collegeId)}`},
  {id:"readiness",title:"Readiness gate",description:"Inspect persisted checklist evidence; do not infer runtime readiness.",href:prefix+"/readiness"},
 ] as const;
}

/** Exact legacy Manage College tabs, rendered as one logical group while
 * reusing the authenticated tenant editors. The IDs map by college UUID;
 * no cross-college tab state or legacy integer identifier is trusted. */
export function superAdminTenantManageTabs(collegeId:string){
 const prefix="/admin/colleges/"+encodeURIComponent(collegeId);
 return [
  {id:"web-address",title:"Web address",href:prefix+"/subdomain"},
  {id:"sign-in",title:"Sign-in",href:prefix+"/signin"},
  {id:"branding",title:"Branding",href:prefix+"/branding"},
  {id:"admins",title:"Admins",href:prefix+"/admins"},
  {id:"activity",title:"Activity",href:prefix+"?tab=activity"},
 ] as const;
}
