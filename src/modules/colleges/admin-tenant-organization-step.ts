import {z} from "zod";
const createdOrganization=z.object({organization:z.object({id:z.uuid()}).passthrough()});
export function createdOrganizationStepHref(raw:unknown):string|null {
 const parsed=createdOrganization.safeParse(raw);
 return parsed.success?"/admin/tenants/create?organizationId="+encodeURIComponent(parsed.data.organization.id):null;
}
/** Only an actual authorized organization from listOrganizations can drive the next stage. */
export function preferredNewTenantOrganization(raw:string|string[]|undefined,allowed:readonly {id:string}[]):string|null {
 if(typeof raw!=="string"||!z.uuid().safeParse(raw).success)return null;
 return allowed.some(row=>row.id===raw)?raw:null;
}
