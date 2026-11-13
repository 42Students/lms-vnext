import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { can } from "@/modules/permissions/policy";
import { RecruiterLeadsWorkspace } from "@/components/tpo/recruiter-leads-workspace";
import CampaignHistory from "./campaigns/page";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";

import { first } from "@/lib/shared";
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
    placed?: string | string[];
    due?: string | string[];
  }>;
};

export default async function TpoRecruiterLeadsPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !can(context,"placements.manage",{collegeId:context.membership.collegeId})) {
    redirect("/dashboard");
  }
  const query = await searchParams;
  // An ambiguous roster URL must not silently select the first of two filters.
  if (Object.values(query).some(Array.isArray)) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Recruiter directory" />
      <ErrorState title="Conflicting recruiter filters"
        description="The link contains multiple values for one filter. No recruiter results were loaded; clear the filters and choose a single value for each field."
        action={<ButtonLink variant="secondary" href="/tpo/recruiters">Clear recruiter filters</ButtonLink>} />
    </div>;
  }
  // Legacy ?due=1 is a bookmarked two-bucket filter (today + overdue).
  // Canonicalize the URL while preserving every other allowlisted roster filter.
  if(first(query.due)==="1"){
    const params=new URLSearchParams();
    const accepted=["view","add","company","page","purpose","q","stage","owner","invite",
      "status","source","reach","designation","nextFollowup","lastActivity","added",
      "need","attention","drives","placed"] as const;
    for(const key of accepted){
      const value=first(query[key]);
      if(typeof value==="string"&&value.length<=100)params.set(key,value);
    }
    if(!params.has("nextFollowup"))params.set("nextFollowup","DUE");
    redirect("/tpo/recruiters?"+params.toString());
  }
  const requested = first(query.view);
  if (requested === "campaigns") {
    return <CampaignHistory searchParams={Promise.resolve({
      ...(first(query.page)===undefined?{}:{page:first(query.page)}),
      ...(first(query.purpose)===undefined?{}:{purpose:first(query.purpose)}),
    })} />;
  }
  // Stage URL is a read filter, not authorization for a manual-stage write.
  // The server must enforce NEW/CONTACTED/NOT_NOW plus NOT_NOW reason.
  const initialView =
    requested === "board" || requested === "companies" ? requested : "table";
  return (
    <div className="min-w-0 space-y-4">
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
        drives:first(query.drives)??"ALL",placed:first(query.placed)??"ALL",
      }}
    />
    </div>
  );
}
