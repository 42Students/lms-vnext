import type { Metadata } from "next";
import authStyles from "@/components/public/public-auth-skin.module.css";
import { Card } from "@/components/ui/card";
import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";
import { Heading } from "@/components/ui/heading";

export const metadata: Metadata = {
  title: "Campaign email preferences | 42LMS",
  robots: { index: false, follow: false },
};

export default async function CampaignUnsubscribe({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // A GET is deliberately not a token-validity oracle. The signed token is
  // checked only when the user explicitly submits the suppression request.
  return (
    <main className={`${authStyles["page"]} flex min-h-dvh w-full min-w-0 items-center justify-center px-4 pb-8 pt-24 md:py-12`}>
      <div className="w-full max-w-xl min-w-0">
        <Card as="section" aria-labelledby="unsubscribe-heading" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface shadow-none">
          <Heading level={1} size="xl" className="m-0 leading-[28px] text-[var(--lms-heading)]" id="unsubscribe-heading">
            Stop these emails?
          </Heading>
          <p id="unsubscribe-details" className="mt-3 break-words text-sm leading-[22px] text-[var(--lms-muted-text)]">
            Opening this link does not unsubscribe you. No preference was changed. Confirm below to stop further emails from this placement cell.
          </p>
          <CampaignUnsubscribeConfirm token={token} cell={true}/>
          <p className="mt-4 break-words text-sm leading-6 text-[var(--lms-muted-text)]">
            To keep your current preference, close this page without selecting Unsubscribe.
          </p>
        </Card>
      </div>
    </main>
  );
}
