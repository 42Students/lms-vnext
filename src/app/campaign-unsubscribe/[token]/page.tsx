import { campaignUnsubscribeTokenKind } from "@/modules/placements/public-unsubscribe-preview-service";
import { PageHeader } from "@/components/ui/page-header";

export default async function CampaignUnsubscribe({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const kind = await campaignUnsubscribeTokenKind(token);
  const cell = kind === "PLACEMENT_CELL";
  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <PageHeader eyebrow="42Students" title={cell ? "Stop these emails?" : "Campaign email preferences"} />
      {!kind ? (
        <p role="alert" className="text-sm text-body">
          This confirmation link is invalid or expired. No preference was changed.
        </p>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">
            {cell ? "Stop these emails?" : "Stop campaign emails?"}
          </h2>
          <p className="mt-2 text-sm text-body">
            {cell
              ? "The placement cell that wrote to you will not email you again."
              : "Opening this link does not unsubscribe you. Confirm to add this address to the global email suppression list."}
          </p>
          <form method="post" action="/api/public/campaign-unsubscribe" className="mt-4">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
              {cell ? "Unsubscribe" : "Confirm unsubscribe"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
