import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Alert } from "@/components/ui/alert";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import {hasMembershipRole} from "@/modules/identity/context";
import {engageAudienceQuerySchema} from "@/modules/messaging/engage-audience-model";
import {previewEngageCampaignAudience} from "@/modules/messaging/engage-audience-service";
type PageProps={searchParams:Promise<{segment?:string|string[]}>};
export default async function PreviewCampaign({searchParams}:PageProps){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const segment=Array.isArray(raw.segment)?raw.segment[0]:raw.segment;
 const query=engageAudienceQuerySchema.safeParse({segment});
 if(!query.success)return <div className="min-w-0 space-y-4"><PageHeader title="Audience preview"/><Alert tone="error">Invalid audience. <Link href="/tpo/recruiters/campaigns/preview" className="text-link underline">Reset</Link></Alert></div>;
 const preview=await previewEngageCampaignAudience(context,query.data);
 return <div className="min-w-0 space-y-6">
  <PageHeader title="Audience preview"
    description="Read-only counts from current recruiter contacts. No messages will be sent from this page." />
  <nav aria-label="Audience segments" className="flex flex-wrap gap-2">
   {(["ALL_ELIGIBLE","NEW","UNASSIGNED"] as const).map(item=><Link key={item}
    href={"/tpo/recruiters/campaigns/preview?segment="+item} aria-current={query.data.segment===item?"page":undefined}
    className={"inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border px-4 text-sm font-semibold "+(query.data.segment===item?"border-primary bg-primary text-on-primary":"border-border bg-surface text-primary-text hover:bg-primary-subtle")}>
    {item.replaceAll("_"," ")}
   </Link>)}
  </nav>
  <section aria-label="Campaign audience totals" className="grid gap-3 min-[768px]:grid-cols-2 lg:grid-cols-3">
   {([["Contacts",preview.total],["Potential recipients",preview.eligible],
      ["No email",preview.withoutEmail],["Opted out",preview.unsubscribed],
      ["Previously bounced",preview.bounced],["Not now",preview.notNow],
      ["Outside selected segment",preview.outsideSegment]] as const).map(([label,value])=>
     <StatTile key={label} label={label} value={value} className={tpoTileStyles.tile} />)}
  </section>
  <p className="text-sm text-body">Potential does not mean deliverable: provider availability, daily caps, global email suppression and non-production allowlists require checks again at dispatch. Sending is not enabled here.</p>
  <Link href="/tpo/recruiters" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm text-link">Back to Engage</Link>
 </div>;
}
