import Link from "next/link";
import { publicUnsubscribeTokenSchema } from "@/modules/placements/public-campaign-unsubscribe-model";

/** GET is strictly read-only; never change mailing preferences on page load. */
export default async function CampaignUnsubscribePage({ params }: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const syntacticallyValid = publicUnsubscribeTokenSchema.safeParse(token).success;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <section className="min-w-0 rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Campaign email preferences
        </h1>
        <p role="status" className="mt-4 text-sm leading-6 text-body">
          {syntacticallyValid
            ? "You have not been unsubscribed. Confirmation is currently unavailable; no changes were made to your preferences. Contact the placement cell to request removal."
            : "This unsubscribe link is invalid. No changes were made to any subscription."}
        </p>
        <Link href="/" className="mt-5 inline-block text-sm text-primary-text underline">Return home</Link>
      </section>
    </main>
  );
}
