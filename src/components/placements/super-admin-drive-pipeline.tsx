import type { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";
import type {SuperAdminDriveAttention} from "@/modules/placements/super-admin-drive-attention-service";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";

type Pipeline = Awaited<ReturnType<typeof getSuperAdminDrivePipeline>>;

/** Six buckets describe present application states, not transitions. */
export function SuperAdminDrivePipeline({rows,attention=[],jobId}: {
 rows: Pipeline | null;
 attention?:readonly SuperAdminDriveAttention[];
 jobId?:string;
}) {
 const warning=attention.length>0&&jobId?(
  <section role="status" aria-label="Needs attention" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-amber-950">
   <h2 className="flex items-center gap-2 text-sm font-semibold">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
     stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round">
     <path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>
    </svg>
    Needs attention ({attention.reduce((sum,row)=>sum+row.count,0)})
   </h2>
   <ul className="mt-2 grid gap-2 sm:grid-cols-2">
    {attention.map(item=><li key={item.label} className="rounded border border-amber-200 bg-white/70 p-3 text-sm">
     <p className="flex flex-wrap items-center gap-2 font-semibold">
      {item.label}
      <span className="rounded bg-amber-100 px-2 py-0.5 tabular-nums">{item.count}</span>
     </p>
     <p className="mt-1">{item.details}</p>
     <Link className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline"
      href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"+
        (item.stage?"?stage="+encodeURIComponent(item.stage):"")}>
      Review applications →
     </Link>
    </li>)}
   </ul>
  </section>
 ):null;
  if(!rows)return <section className="space-y-2 border-b border-border pb-4" aria-label="Pipeline">
    {warning}
    <h2 className="font-semibold">Pipeline</h2>
    <Banner tone="warning" role="alert">
      Could not load pipeline metrics. Drive details and actions remain available. Reload this drive to retry.
    </Banner>
  </section>;
  return <section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]"
    aria-label="Drive pipeline snapshot">
    {warning}
    <div>
      <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Pipeline</h2>
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
            stage.key==="hired"?"text-[#3f8600]":"text-[var(--lms-heading)]")}>{stage.count}</p>
      </div>)}
    </div>
    <p className="sr-only">
      {rows.total} submitted applications · {rows.waitlisted} waitlisted · {rows.rejected} rejected
    </p>
  </section>;
}
