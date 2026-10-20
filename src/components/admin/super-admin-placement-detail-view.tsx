import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import type {SuperAdminPlacementDetail} from "@/modules/admin-ui/super-admin-placement-detail-model";
export function SuperAdminPlacementDetailView({data}:{data:SuperAdminPlacementDetail}){
 return <div className="min-w-0 space-y-5">
  <PageHeader title={data.title} description={data.subtitle}
   actions={<>
    <PageBackLink href={data.backHref} label="Back to directory" className="print:hidden" />
    {data.related?<Link href={data.related.href} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] md:w-auto border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 print:hidden">{data.related.label} →</Link>:null}
   </>} />
  <div className="flex flex-wrap items-center gap-2">
   <StatusBadge tone={data.status==="ACTIVE"||data.status==="ACCEPTED"?"success":"neutral"}>{data.status}</StatusBadge>
  </div>
  <dl className="grid min-w-0 gap-3 min-[768px]:grid-cols-2">
   {data.facts.map(fact=><div key={fact.label} className="min-w-0 border-b border-border py-4">
    <dt className="text-xs font-semibold text-muted-foreground">{fact.label}</dt>
    <dd className="mt-2 break-words text-sm font-medium text-foreground">{fact.value}</dd>
   </div>)}
  </dl>
  <p className="text-xs text-muted-foreground">This is a read-only, selected-college view. Changing the scope never changes the record being requested; inaccessible records return not found.</p>
 </div>;
}
