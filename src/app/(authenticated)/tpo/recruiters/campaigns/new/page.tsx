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
export default async function NewTpoCampaignPage({searchParams}:{searchParams:Promise<{selected?:string}>}){
 const raw=(await searchParams).selected??"";
 const selectedLeadIds=[...new Set(raw.split(",").filter(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))].slice(0,100);
 const ctx=await getCurrentRequestContext();
 if(!ctx.membership||!hasMembershipRole(ctx,"TPO"))redirect("/dashboard");
 const ready=await tpoCampaignDraftStorageReady();
 const deliveryReady=ready&&await tpoCampaignDispatchReady();
 return <main className="space-y-5">
  <PageHeader eyebrow="Engage · Campaigns" title="New email campaign"
   description="Reach recruiter leads in your college with a saved and auditable audience snapshot."/>
  <Link href="/tpo/recruiters/campaigns" className="text-sm text-primary-text underline">← Campaign history</Link>
  {ready?<TpoCampaignCompose deliveryReady={deliveryReady} selectedLeadIds={selectedLeadIds}/>:
   <p role="alert" className="rounded-lg border border-border bg-surface p-5 text-sm text-body">
    {CAMPAIGN_DRAFT_UNAVAILABLE}
   </p>}
 </main>;
}
