/** Allowlist entity navigation only when the canonical audit subject type itself
 * identifies an accessible placement resource. Never interpolate arbitrary types. */
export function tpoAuditEntityHref(entityType:string,entityId:string):string|null{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entityId))
  return null;
 const routes:Record<string,string>={
  placement_job:"/tpo/placements/jobs/",
  placement_recruiter_lead:"/tpo/recruiters/",
  placement_company:"/tpo/companies/",
 };
 const base=routes[entityType.toLowerCase()];
 return base?base+encodeURIComponent(entityId):null;
}
