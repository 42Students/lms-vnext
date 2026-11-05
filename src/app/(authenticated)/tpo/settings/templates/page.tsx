import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { requireTpoBatchActor } from "@/modules/placements/tpo-batch-workspace-read-service";
import { TPO_MANUAL_MESSAGE_TEMPLATES } from "@/modules/placements/tpo-communication-prep-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";

export const dynamic = "force-dynamic";
export default async function TpoCommunicationTemplatesPage() {
  await requireTpoBatchActor(await getCurrentRequestContext());
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Communication templates" />
    <div className="print:hidden"><TpoSettingsNav active="templates" compact /></div>
    <p className="text-sm text-body leading-[22px]">Safe draft text for manual use. These are source-provided examples, not stored college templates. Copying text does not send email, SMS, WhatsApp or a portal notice.</p>
    <p className="text-xs text-muted-foreground leading-5">No recipients are selected or contacted.</p>
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">{TPO_MANUAL_MESSAGE_TEMPLATES.map(item=><section key={item.kind} className="min-w-0 space-y-3 border-t border-border pt-5">
      <Heading level={2} size="base" className="leading-6 md:text-lg md:leading-7">{item.label}</Heading>
      <Label className="block text-[length:var(--lms-font-sm)] print:hidden">Subject<Input readOnly value={item.subject} className="mt-[6px] w-full min-h-11 md:min-h-9"/></Label>
      <p className="hidden text-sm print:block leading-[22px]"><strong>Subject:</strong> {item.subject}</p>
      <Label className="block text-[length:var(--lms-font-sm)] print:hidden">Draft text<Textarea readOnly value={item.body} rows={5} className="mt-[6px] w-full resize-y"/></Label>
      <p className="hidden whitespace-pre-wrap break-words text-sm print:block leading-[22px]">{item.body}</p>
    </section>)}</div>
    <TextLink href="/tpo/batches" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto sm:justify-start md:min-h-9 print:hidden">Review batches and their actual deadlines</TextLink>
  </div>;
}
