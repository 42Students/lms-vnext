import { z } from "zod";
export const tenantSetupQuerySchema=z.object({tab:z.enum(["create","setup"]).default("create")}).strict();
export function tenantSetupPresentation(input:{
  tab:"create"|"setup";selectedCollegeId:string|null;canCreateOrganization:boolean;canCreateCollege:boolean;
}) {
 return {
  showCreate:input.tab==="create",
  showSetup:input.tab==="setup",
  canCreateOrganization:input.tab==="create"&& !input.selectedCollegeId && input.canCreateOrganization,
  canCreateCollege:input.tab==="create"&& !input.selectedCollegeId && input.canCreateCollege,
  requiresCollege:input.tab==="setup"&&!input.selectedCollegeId,
 };
}
