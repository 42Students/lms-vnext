/** Legacy CompanyController endpoint crosswalk. These are destinations,
 * not unauthenticated aliases: the placement routes enforce same-origin
 * mutations, selected-college membership and active company relationships.
 * No numeric legacy IDs are accepted as vNext UUID identifiers.
 *
 * Lifecycle parity:
 * - Creating a company resolves the canonical domain under a DB lock and
 *   links an ACTIVE college relationship, with an activity event.
 * - Updating mutates only college-owned CRM relationship fields.
 * - Legacy hard DELETE maps to archive; active dependent jobs block it.
 *   Neither canonical employer nor historical job/application data is deleted.
 * - Restore revives only an archived relationship with an ACTIVE global
 *   company, and records a restoration event.
 * - Company stats and job counts belong to the scoped directory/read APIs,
 *   not to an unguarded global-company enumeration.
 */
export const LEGACY_COMPANY_ENDPOINTS = {
  list: {method:"GET",path:"/api/placements/companies"},
  create: {method:"POST",path:"/api/placements/companies"},
  update: {method:"PATCH",path:"/api/placements/companies/:relationshipId"},
  archive: {method:"DELETE",path:"/api/placements/companies/:relationshipId"},
  restore: {method:"POST",path:"/api/placements/companies/:relationshipId/restore"},
  directory: {method:"GET",path:"/admin/companies"},
} as const;

export type LegacyCompanyAction=keyof typeof LEGACY_COMPANY_ENDPOINTS;

export function legacyCompanyDestination(action:LegacyCompanyAction,relationshipId?:string){
  const endpoint=LEGACY_COMPANY_ENDPOINTS[action];
  if(endpoint.path.includes(":relationshipId")){
    if(!relationshipId || !/^[0-9a-f-]{36}$/i.test(relationshipId))
      return null;
    return {method:endpoint.method,path:endpoint.path.replace(":relationshipId",encodeURIComponent(relationshipId))};
  }
  return endpoint;
}
