import type { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";
import type {SuperAdminDriveAttention} from "@/modules/placements/super-admin-drive-attention-service";
import { Banner } from "@/components/ui/banner";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

type Pipeline = Awaited<ReturnType<typeof getSuperAdminDrivePipeline>>;

/** Six buckets describe present application states, not transitions. */
export function SuperAdminDrivePipeline({rows,attention=[],jobId}: {
 rows: Pipeline | null;
 attention?:readonly SuperAdminDriveAttention[];
 jobId?:string;
}) {
 const warning=attention.length>0&&jobId?(
  <section role="status" aria-label="Needs attention" className="border-l-2 border-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] px-4 py-3 text-[color:var(--lms-warning-strong)]">
   <Heading level={2} size="sm" className="flex items-center gap-2">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
     stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round">
     <path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>
    </svg>
    Needs attention ({attention.reduce((sum,row)=>sum+row.count,0)})
   </Heading>
   <ul className="mt-2 grid gap-2 sm:grid-cols-2">
    {attention.map(item=><li key={item.label} className="rounded border border-[color:var(--lms-icon-amber)] bg-[color:color-mix(in_srgb,var(--lms-white)_70%,transparent)] p-3 text-sm">
     <p className="flex flex-wrap items-center gap-2 font-semibold">
      {item.label}
      <span className="rounded bg-[color:var(--lms-gold-subtle)] px-2 py-0.5 tabular-nums">{item.count}</span>
     </p>
     <p className="mt-1">{item.details}</p>
     <TextLink className="mt-2 inline-flex min-h-9 items-center"
      href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"+
        (item.stage||item.filter?"?"+new URLSearchParams({
          ...(item.stage?{stage:item.stage}:{}),
          ...(item.filter?{attention:item.filter}:{}),
        }).toString():"")}>
      Review applications →
     </TextLink>
    </li>)}
   </ul>
  </section>
 ):null;
  if(!rows)return <section className="space-y-2 border-b border-border pb-4" aria-label="Pipeline">
    {warning}
    <Heading level={2}>Pipeline</Heading>
    <Banner tone="warning" role="alert">
      Could not load pipeline metrics. Drive details and actions remain available. Reload this drive to retry.
    </Banner>
  </section>;
  return <section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]"
    aria-label="Drive pipeline snapshot">
    {warning}
    <div>
      <Heading level={2} size="base" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">Pipeline</Heading>
      <p className="mt-1 text-sm text-body leading-[22px]">
        Current application stages. Totals reflect persisted decisions, not estimates of completed rounds.
      </p>
    </div>
    <div className="grid min-w-0 grid-cols-2 border-y border-border sm:grid-cols-3 xl:grid-cols-6">
      {rows.funnel.map((stage) => <div key={stage.key}
        className="min-w-0 border-b border-r border-border px-[var(--lms-space-3)] py-[var(--lms-space-3)]">
        <p className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{stage.label}</p>
        <p className={"mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums " +
          (stage.key==="applied"?"text-[var(--lms-primary)]":
            stage.key==="hired"?"text-[color:var(--lms-success-strong)]":"text-[var(--lms-heading)]")}>{stage.count}</p>
      </div>)}
    </div>
    <p className="sr-only">
      {rows.total} submitted applications · {rows.waitlisted} waitlisted · {rows.rejected} rejected
    </p>
  </section>;
}
