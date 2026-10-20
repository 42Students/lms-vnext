import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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
  <PageHeader title="Review recipients"/>
  <Alert tone="error">Some selected recruiters could not be identified. No campaign draft was created. Return to Engage and select up to 100 recruiters again.</Alert>
  <Link href="/tpo/recruiters" className="inline-flex min-h-11 items-center text-link underline lms-inline-link md:min-h-9">Return to Engage</Link>
 </div>;
 const ready=await tpoCampaignDraftStorageReady();
 const deliveryReady=ready&&await tpoCampaignDispatchReady();
 return <div className="min-w-0 space-y-5">
  <PageHeader title="New email campaign"
   description="Reach recruiter leads in your college with a saved and auditable audience snapshot."
   actions={<Link href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 items-center text-sm text-link underline lms-inline-link md:min-h-9">← Campaign history</Link>} />
  {ready?<TpoCampaignCompose deliveryReady={deliveryReady} selectedLeadIds={selectedLeadIds}/>:
   <p role="alert" className="border-l-2 border-warning-border bg-warning-subtle px-4 py-3 text-sm text-body">
    {CAMPAIGN_DRAFT_UNAVAILABLE}
   </p>}
 </div>;
}
