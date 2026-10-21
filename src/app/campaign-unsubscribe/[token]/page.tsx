import authStyles from "@/components/public/public-auth-skin.module.css";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";

export default async function CampaignUnsubscribe({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // A GET is deliberately not a token-validity oracle. The signed token is
  // checked only when the user explicitly submits the suppression request.
  return (
    <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 flex-col justify-center gap-4 px-4 pb-8 pt-24 min-[768px]:gap-6 min-[768px]:py-12`}>
      <PageHeader eyebrow="42Students" title="Stop these emails?" />
      <Card as="section">
        <p className="mt-2 max-w-prose break-words text-sm leading-6 text-body">
          Confirm below to unsubscribe from these emails. Opening the link does not change your preferences.
        </p>
        <CampaignUnsubscribeConfirm token={token} cell={true}/>
      </Card>
    </main>
  );
}
