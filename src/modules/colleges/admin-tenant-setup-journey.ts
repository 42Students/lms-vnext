/** A grouped setup journey, not a readiness verdict. Links are all established Super Admin routes. */
export function superAdminTenantSetupSteps(collegeId:string){
 const prefix=`/admin/colleges/${encodeURIComponent(collegeId)}`;
 return [
  {id:"brand",title:"Identity & brand",description:"Inspect stored brand assets and contact/support links.",href:prefix+"/branding"},
  {id:"login",title:"Sign-in methods",description:"Review staged college login preferences, without changing authentication.",href:prefix+"/signin"},
  {id:"host",title:"Web address",description:"Verify domains and choose a verified primary host.",href:prefix+"/subdomain"},
  {id:"preview",title:"Host resolution preview",description:"In the global Super Admin scope, preview verified tenant resolution without a DNS lookup.",href:"/admin/tenants/resolve-preview"},
  {id:"academics",title:"Academic setup",description:"Set up departments, programs, semesters and classes.",href:"/admin/academics"},
  {id:"people",title:"College accounts",description:"Review college people and membership roles.",href:"/admin/people"},
  {id:"features",title:"Module controls",description:"Inspect effective Projects, Placements and Electives access.",href:`/admin/features/${encodeURIComponent(collegeId)}`},
  {id:"readiness",title:"Readiness gate",description:"Inspect persisted checklist evidence; do not infer runtime readiness.",href:prefix+"/readiness"},
 ] as const;
}
