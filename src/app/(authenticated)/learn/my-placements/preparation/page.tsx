import Link from "next/link";
import {LearnerPrepAssignmentCards} from "@/components/placements/learner-prep-assignment-cards";
import {placementTableExists} from "@/modules/placements/staged-tables";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  learnerPreparationHref, learnerPreparationQuerySchema,
} from "@/modules/placements/learner-preparation-model";
import { getOwnLearnerPlacementPreparation } from "@/modules/placements/learner-preparation-service";

type Params={view?:string|string[]};
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;

export default async function LearnerPlacementPreparationPage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const raw=await searchParams;
  const parsed=learnerPreparationQuerySchema.safeParse({view:first(raw.view)??undefined});
  if(!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid preparation filter</h1>
    <Link href="/learn/my-placements/preparation"
      className="text-primary-text underline">Clear filters</Link>
  </section>;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"LEARNER")) redirect("/dashboard");
  const data=await getOwnLearnerPlacementPreparation(context,parsed.data);
  return <div className="space-y-6">
    <PageHeader eyebrow="Learner · My Placements" title="Placement preparation"
      description="A checklist of information and activity actually recorded for your account."
      actions={<Link href="/learn/my-placements"
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        My Placements
      </Link>} />
    {(await placementTableExists("placement_tpo_prep_assignments"))?<LearnerPrepAssignmentCards/>:null}
    <section aria-label="Recorded preparation summary"
      className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-sm font-semibold text-foreground">
        {data.recorded} of {data.total} information categories recorded
      </p>
      <p className="mt-2 text-sm text-body">
        This is not a placement eligibility decision, application approval,
        hiring-readiness score, or requirement imposed by your college.
        Missing entries are not treated as failures.
      </p>
    </section>
    <nav aria-label="Preparation filter" className="flex flex-wrap gap-2">
      {([
        ["ALL","All categories"],
        ["RECORDED","Recorded"],
        ["MISSING","Not recorded"],
      ] as const).map(([view,label])=>
        <Link key={view} href={learnerPreparationHref({view})}
          aria-current={data.query.view===view?"page":undefined}
          className={data.query.view===view
            ? "inline-flex min-h-10 items-center rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            : "inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-body"}>
          {label}
        </Link>)}
    </nav>
    {data.items.length===0 ? <EmptyState title="No categories match"
      description={data.query.view==="MISSING"
        ? "Each tracked category has some recorded information. This does not certify placement readiness."
        : "No categories match this filter. Try All categories."}/>
      : <ol className="grid gap-3 sm:grid-cols-2">
        {data.items.map(item=>
          <li key={item.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">{item.title}</h2>
              <span className="text-xs font-semibold text-body">
                {item.recorded?"Recorded":"Not recorded"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-body">{item.description}</p>
            <Link href={item.href}
              className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
              {item.recorded?"Review recorded information":"Review this section"} →
            </Link>
          </li>)}
        </ol>}
    <p className="text-xs leading-5 text-muted-foreground">
      This view uses registered current college enrollment, Learner profile
      and application history. It does not show private identification values,
      infer eligibility, submit applications, or send notifications.
    </p>
  </div>;
}
