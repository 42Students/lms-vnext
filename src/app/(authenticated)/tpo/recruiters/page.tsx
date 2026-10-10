import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { RecruiterLeadsWorkspace } from "@/components/tpo/recruiter-leads-workspace";

export default async function TpoRecruiterLeadsPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  return <RecruiterLeadsWorkspace collegeId={context.membership.collegeId} />;
}
