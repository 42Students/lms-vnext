import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { RecruiterLeadsWorkspace } from "@/components/tpo/recruiter-leads-workspace";

type PageProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function TpoRecruiterLeadsPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const query = await searchParams;
  const requested = Array.isArray(query.view) ? query.view[0] : query.view;
  const initialView =
    requested === "board" || requested === "companies" ? requested : "table";
  return (
    <RecruiterLeadsWorkspace
      collegeId={context.membership.collegeId}
      initialView={initialView}
    />
  );
}
