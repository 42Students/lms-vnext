import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { can } from "@/modules/permissions/policy";
import { RecruiterLeadsWorkspace } from "@/components/tpo/recruiter-leads-workspace";
import CampaignHistory from "./campaigns/page";

type PageProps = {
  searchParams: Promise<{
    view?: string | string[];
    add?: string | string[];
    company?: string | string[];
    page?: string | string[];
    purpose?: string | string[];
    q?: string | string[];
    stage?: string | string[];
    owner?: string | string[];
    invite?: string | string[];
    status?: string | string[];
    source?: string | string[];
    reach?: string | string[];
    designation?: string | string[];
    nextFollowup?: string | string[];
    lastActivity?: string | string[];
    added?: string | string[];
    need?: string | string[];
    attention?: string | string[];
    drives?: string | string[];
    due?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoRecruiterLeadsPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !can(context,"placements.manage",{collegeId:context.membership.collegeId})) {
    redirect("/dashboard");
  }
  const query = await searchParams;
  const requested = first(query.view);
  if (requested === "campaigns") {
    return <CampaignHistory searchParams={Promise.resolve({
      page:first(query.page),purpose:first(query.purpose),
    })} />;
  }
  // Stage URL is a read filter, not authorization for a manual-stage write.
  // The server must enforce NEW/CONTACTED/NOT_NOW plus NOT_NOW reason.
  const initialView =
    requested === "board" || requested === "companies" ? requested : "table";
  return (
    <RecruiterLeadsWorkspace
      collegeId={context.membership.collegeId}
      initialView={initialView}
      initialAdd={first(query.add) === "1"}
      initialCompany={first(query.company)?.trim() ?? ""}
      initialFilters={{
        q:first(query.q)??"",stage:first(query.stage)??"ALL",
        owner:first(query.owner)??"ALL",invite:first(query.invite)??"ALL",
        status:first(query.status)??"ALL",source:first(query.source)??"ALL",
        company:first(query.company)??"ALL",reach:first(query.reach)??"ALL",
        designation:first(query.designation)??"",
        nextFollowup:first(query.nextFollowup)??(first(query.due)==="1"?"DUE":"ALL"),
        lastActivity:first(query.lastActivity)??"ALL",added:first(query.added)??"ALL",
        need:first(query.need)??"ALL",attention:first(query.attention)??"ALL",
        drives:first(query.drives)??"ALL",
      }}
    />
  );
}
