import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementJobCreateWorkspace} from "@/components/placements/placement-job-create-workspace";
/** TPO-drives-52: PageHeader, one white canvas and all input states are rendered by PlacementJobCreateWorkspace; quick and full entrypoints now use ONE audited form,
 * autosave key, eligibility preview, validation, and draft/publish semantics.
 * Existing bookmarks still work; no duplicate create implementation exists.
 */
export default async function TpoQuickDraftStepOnePage(){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))
  redirect("/dashboard");
 return <PlacementJobCreateWorkspace
   context={context}
   collegeId={context.membership.collegeId}
   eyebrow="TPO"
   basePath="/tpo/placements"
 />;
}
