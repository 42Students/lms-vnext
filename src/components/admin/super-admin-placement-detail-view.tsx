import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import type {SuperAdminPlacementDetail} from "@/modules/admin-ui/super-admin-placement-detail-model";
export function SuperAdminPlacementDetailView({data}:{data:SuperAdminPlacementDetail}){
 return <div className="min-w-0 space-y-5">
  <PageHeader title={data.title} description={data.subtitle}/>
  <div className="flex flex-wrap gap-3 items-center">
   <StatusBadge tone={data.status==="ACTIVE"||data.status==="ACCEPTED"?"success":"neutral"}>{data.status}</StatusBadge>
   <Link href={data.backHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">← Back to directory</Link>
   {data.related?<Link href={data.related.href} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">{data.related.label} →</Link>:null}
  </div>
  <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
   {data.facts.map(fact=><div key={fact.label} className="min-w-0 border-b border-border py-4">
    <dt className="text-xs font-semibold text-muted-foreground">{fact.label}</dt>
    <dd className="mt-2 break-words text-sm font-medium text-foreground">{fact.value}</dd>
   </div>)}
  </dl>
  <p className="text-xs text-muted-foreground">This is a read-only, selected-college view. Changing the scope never changes the record being requested; inaccessible records return not found.</p>
 </div>;
}
