import authStyles from "@/components/public/public-auth-skin.module.css";
import Link from "next/link";
import { campaignUnsubscribeTokenKind } from "@/modules/placements/public-unsubscribe-preview-service";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";

export default async function CampaignUnsubscribe({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // A storage outage is not proof that an opt-out token is invalid.
  // GET must not change preferences or mislead someone about suppression.
  let kind: Awaited<ReturnType<typeof campaignUnsubscribeTokenKind>> = null;
  let unavailable = false;
  try {
    kind = await campaignUnsubscribeTokenKind(token);
  } catch {
    unavailable = true;
  }
  const cell = kind === "PLACEMENT_CELL";
  return (
    <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-lg min-w-0 flex-col justify-center gap-6 px-4 py-8 min-[768px]:py-12`}>
      <PageHeader eyebrow="42Students" title={cell ? "Stop these emails?" : "Campaign email preferences"} />
      {unavailable ? (
        <Card as="section" role="alert">
          <p className="text-base leading-6 text-body">We couldn't check this confirmation link right now. No preference was changed.</p>
          <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-link md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={"/campaign-unsubscribe/"+encodeURIComponent(token)}>Retry</Link>
        </Card>
      ) : !kind ? (
        <Card as="section" role="alert">
          <p className="text-base leading-6 text-body">This confirmation link is invalid or expired. No preference was changed.</p>
        </Card>
      ) : (
        <Card as="section">
          <h2 className="font-semibold text-foreground">
            {cell ? "Stop these emails?" : "Stop campaign emails?"}
          </h2>
          <p className="mt-2 text-sm text-body">
            {cell
              ? "The placement cell that wrote to you will not email you again."
              : "Opening this link does not unsubscribe you. Confirm to add this address to the global email suppression list."}
          </p>
          <CampaignUnsubscribeConfirm token={token} cell={cell}/>
        </Card>
      )}
    </main>
  );
}
