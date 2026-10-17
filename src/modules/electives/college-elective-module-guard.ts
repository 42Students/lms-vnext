import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {AuthorizationError} from "@/modules/permissions/policy";

/** COL-academic-setup-R01: validate the resolved college module policy
 * on every elective write path as well as at the page boundary. */
export async function assertCollegeElectivesEnabled(context:RequestContext){
 const state=await resolveOptionalModuleAccess(context);
 if(!state.electives.enabled)throw new AuthorizationError("academics.manage");
 return state.electives;
}
