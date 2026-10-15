import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { requireTpoBatchActor } from "@/modules/placements/tpo-batch-workspace-read-service";
import { TPO_MANUAL_MESSAGE_TEMPLATES } from "@/modules/placements/tpo-communication-prep-model";

export const dynamic = "force-dynamic";
export default async function TpoCommunicationTemplatesPage() {
  await requireTpoBatchActor(await getCurrentRequestContext());
  return <main className="min-w-0 space-y-5">
    <TpoSettingsNav active="templates" />
    <h1 className="text-xl font-semibold">Communication templates</h1>
    <p className="text-sm text-body">Safe draft text for manual use. These are source-provided examples, not stored college templates. Copying text does not send email, SMS, WhatsApp or a portal notice.</p>
    <div className="grid gap-4 lg:grid-cols-2">{TPO_MANUAL_MESSAGE_TEMPLATES.map(item=><section key={item.kind} className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold">{item.label}</h2>
      <label className="block text-sm">Subject<input readOnly value={item.subject} className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
      <label className="block text-sm">Draft text<textarea readOnly value={item.body} rows={5} className="mt-1 w-full rounded border border-border bg-surface p-3"/></label>
      <p className="text-xs text-muted-foreground">No recipients are selected or contacted.</p>
    </section>)}</div>
    <Link href="/tpo/batches" className="inline-flex min-h-11 items-center text-primary-text underline">Review batches and their actual deadlines</Link>
  </main>;
}
