import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {TpoCampaignCompose} from "@/components/tpo/tpo-campaign-compose";
import {tpoCampaignDraftStorageReady} from "@/modules/messaging/tpo-campaign-draft-service";
import {tpoCampaignDispatchReady} from "@/modules/messaging/tpo-campaign-dispatch-service";
import {CAMPAIGN_DRAFT_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
export const dynamic="force-dynamic";
export default async function NewTpoCampaignPage({searchParams}:{searchParams:Promise<{selected?:string|string[]}>}){
 const requested=(await searchParams).selected;
 const raw=typeof requested==="string"?requested:"";
 const invalidSelection=Array.isArray(requested);
 const candidateIds=raw?raw.split(","):[];
 const validIds=candidateIds.filter(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
 const selectedLeadIds=[...new Set(validIds)];
 const unsafeSelection=invalidSelection||(requested!==undefined&&raw.length===0)||(raw.length>0&&(candidateIds.length>100||
   validIds.length!==candidateIds.length||selectedLeadIds.length===0));
 const ctx=await getCurrentRequestContext();
 if(!ctx.membership||!hasMembershipRole(ctx,"TPO"))redirect("/dashboard");
 if(unsafeSelection)return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Engage · Campaigns" title="Review recipients"/>
  <p role="alert">Some selected recruiters could not be identified. No campaign draft was created. Return to Engage and select up to 100 recruiters again.</p>
  <Link href="/tpo/recruiters" className="text-link underline lms-inline-link">Return to Engage</Link>
 </div>;
 const ready=await tpoCampaignDraftStorageReady();
 const deliveryReady=ready&&await tpoCampaignDispatchReady();
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Engage · Campaigns" title="New email campaign"
   description="Reach recruiter leads in your college with a saved and auditable audience snapshot."/>
  <Link href="/tpo/recruiters/campaigns" className="text-sm text-link underline lms-inline-link">← Campaign history</Link>
  {ready?<TpoCampaignCompose deliveryReady={deliveryReady} selectedLeadIds={selectedLeadIds}/>:
   <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-[var(--lms-space-5)] text-sm text-body">
    {CAMPAIGN_DRAFT_UNAVAILABLE}
   </p>}
 </div>;
}
