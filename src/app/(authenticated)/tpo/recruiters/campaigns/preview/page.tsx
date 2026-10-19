import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
 if(!query.success)return <div role="alert" className="p-5">Invalid audience. <Link href="/tpo/recruiters/campaigns/preview">Reset</Link></div>;
 const preview=await previewEngageCampaignAudience(context,query.data);
 return <div className="min-w-0 space-y-6">
  <PageHeader title="Audience preview"
    description="Read-only counts from current recruiter contacts. No messages will be sent from this page." />
  <nav aria-label="Audience segments" className="flex flex-wrap gap-2">
   {(["ALL_ELIGIBLE","NEW","UNASSIGNED"] as const).map(item=><Link key={item}
    href={"/tpo/recruiters/campaigns/preview?segment="+item} aria-current={query.data.segment===item?"page":undefined}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text">
    {item.replaceAll("_"," ")}
   </Link>)}
  </nav>
  <dl className="grid gap-3 min-[768px]:grid-cols-2 lg:grid-cols-3">
   {([["Contacts",preview.total],["Potential recipients",preview.eligible],
      ["No email",preview.withoutEmail],["Opted out",preview.unsubscribed],
      ["Previously bounced",preview.bounced],["Not now",preview.notNow],
      ["Outside selected segment",preview.outsideSegment]] as const).map(([label,value])=>
    <div key={label} className="border-b border-border px-1 py-4">
     <dt className="text-sm text-body">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>)}
  </dl>
  <p className="text-sm text-body">Potential does not mean deliverable: provider availability, daily caps, global email suppression and non-production allowlists require checks again at dispatch. Sending is not enabled here.</p>
  <Link href="/tpo/recruiters" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm text-link">Back to Engage</Link>
 </div>;
}
