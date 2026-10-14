import "server-only";
import { z } from "zod";
import { listColleges, CollegeServiceError } from "./service";
import { listOrganizations } from "@/modules/organizations/service";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { tenantPage, tenantReadQuerySchema } from "./super-admin-tenant-model";
export async function getAdminTenantDirectory(context:RequestContext,raw:unknown) {
 if(!isSuperAdmin(context)) throw new AuthorizationError("college.read");
 const query=tenantReadQuerySchema.parse(raw);
 const [colleges,organizations]=await Promise.all([listColleges(context),listOrganizations(context)]);
 const names=new Map(organizations.map(o=>[o.id,o.name]));
 const permitted=colleges.map(x=>({...x,organizationName:names.get(x.organizationId)??"Unavailable"}));
 return {...tenantPage(permitted,query),query,organizations};
}
export async function getAdminTenantDetail(context:RequestContext,rawId:unknown) {
 if(!isSuperAdmin(context)) throw new AuthorizationError("college.read");
 const id=z.string().uuid().safeParse(rawId);
 if(!id.success) throw new CollegeServiceError("COLLEGE_NOT_FOUND");
 // Membership is never substituted for selected admin scope.
 const [colleges,organizations]=await Promise.all([listColleges(context),listOrganizations(context)]);
 const row=colleges.find(x=>x.id===id.data);
 if(!row) throw new CollegeServiceError("COLLEGE_NOT_FOUND");
 return {...row,organizationName:organizations.find(x=>x.id===row.organizationId)?.name??"Unavailable"};
}
