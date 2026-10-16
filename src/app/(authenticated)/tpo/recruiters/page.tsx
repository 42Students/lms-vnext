import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { RecruiterLeadsWorkspace } from "@/components/tpo/recruiter-leads-workspace";
import CampaignHistory from "./campaigns/page";

type PageProps = {
  searchParams: Promise<{
    view?: string | string[];
    add?: string | string[];
    company?: string | string[];
    page?: string | string[];
    purpose?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoRecruiterLeadsPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const query = await searchParams;
  const requested = first(query.view);
  if (requested === "campaigns") {
    return <CampaignHistory searchParams={Promise.resolve({
      page:first(query.page),purpose:first(query.purpose),
    })} />;
  }
  const initialView =
    requested === "board" || requested === "companies" ? requested : "table";
  return (
    <RecruiterLeadsWorkspace
      collegeId={context.membership.collegeId}
      initialView={initialView}
      initialAdd={first(query.add) === "1"}
      initialCompany={first(query.company)?.trim() ?? ""}
    />
  );
}
