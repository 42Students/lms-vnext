import Link from "next/link";
import type { ReactNode } from "react";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import type {SuperAdminPlacementDetail} from "@/modules/admin-ui/super-admin-placement-detail-model";
export function SuperAdminPlacementDetailView({data,extraActions}:{data:SuperAdminPlacementDetail;extraActions?:ReactNode}){
 return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <PageHeader title={data.title} description={data.subtitle}
   actions={<>
    <PageBackLink href={data.backHref} label="Back to directory" className="print:hidden" />
    {extraActions}
    {data.related?<Link href={data.related.href} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] md:w-auto border border-[var(--lms-canvas-border)] bg-[var(--lms-white)] px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 print:hidden">{data.related.label} →</Link>:null}
   </>} />
  <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
   <StatusBadge tone={data.status==="ACTIVE"||data.status==="ACCEPTED"?"success":"neutral"}>{data.status}</StatusBadge>
  </div>
  <dl className="grid min-w-0 grid-cols-1 gap-x-[var(--lms-space-6)] gap-y-0 sm:grid-cols-2">
   {data.facts.map(fact=><div key={fact.label} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] first:pt-0">
    <dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">{fact.label}</dt>
    <dd className="mt-[var(--lms-space-1)] break-words text-[var(--lms-font-base)] font-medium leading-6 text-foreground">{fact.value}</dd>
   </div>)}
  </dl>
  <p className="max-w-3xl text-xs leading-5 text-muted-foreground">This is a read-only, selected-college view. Changing the scope never changes the record being requested; inaccessible records return not found.</p>
 </div>;
}
