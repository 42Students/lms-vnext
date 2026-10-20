import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { requireTpoBatchActor } from "@/modules/placements/tpo-batch-workspace-read-service";
import { TPO_MANUAL_MESSAGE_TEMPLATES } from "@/modules/placements/tpo-communication-prep-model";

export const dynamic = "force-dynamic";
export default async function TpoCommunicationTemplatesPage() {
  await requireTpoBatchActor(await getCurrentRequestContext());
  return <div className="min-w-0 space-y-5">
    <div className="print:hidden"><TpoSettingsNav active="templates" /></div>
    <PageHeader title="Communication templates" />
    <p className="text-sm text-body">Safe draft text for manual use. These are source-provided examples, not stored college templates. Copying text does not send email, SMS, WhatsApp or a portal notice.</p>
    <div className="grid min-w-0 grid-cols-1 gap-4 min-[992px]:grid-cols-2">{TPO_MANUAL_MESSAGE_TEMPLATES.map(item=><section key={item.kind} className="min-w-0 space-y-3 border-t border-border pt-5">
      <h2 className="text-[16px] font-semibold leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">{item.label}</h2>
      <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] print:hidden">Subject<Input readOnly value={item.subject} className="mt-1 w-full min-h-11 min-[768px]:min-h-9"/></label>
      <p className="hidden text-sm print:block"><strong>Subject:</strong> {item.subject}</p>
      <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] print:hidden">Draft text<Textarea readOnly value={item.body} rows={5} className="mt-1 w-full"/></label>
      <p className="hidden whitespace-pre-wrap break-words text-sm print:block">{item.body}</p>
      <p className="text-xs text-muted-foreground">No recipients are selected or contacted.</p>
    </section>)}</div>
    <Link href="/tpo/batches" className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Review batches and their actual deadlines</Link>
  </div>;
}
