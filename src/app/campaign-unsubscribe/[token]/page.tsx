import { Card } from "@/components/ui/card";
import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";

export default async function CampaignUnsubscribe({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // A GET is deliberately not a token-validity oracle. The signed token is
  // checked only when the user explicitly submits the suppression request.
  return (
    <main className="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4">
      <div className="w-full max-w-[440px]">
        <Card as="section" className="rounded-[8px] border border-[#e5e5e5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <h1 className="m-0 text-[20px] font-semibold leading-[28px] text-[var(--lms-heading)]">
            Stop these emails?
          </h1>
          <p className="mt-3 break-words text-sm leading-[22px] text-[var(--lms-muted-text)]">
            The placement cell that wrote to you will not email you again.
          </p>
          <CampaignUnsubscribeConfirm token={token} cell={true}/>
        </Card>
      </div>
    </main>
  );
}
