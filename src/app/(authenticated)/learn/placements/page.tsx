import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";

export default async function LearnerPlacementsAliasPage() {
  const context=await getCurrentRequestContext();
  if(!hasActiveMembership(context)||!hasMembershipRole(context,"LEARNER"))redirect("/dashboard");
  redirect("/learn/my-placements");
}
