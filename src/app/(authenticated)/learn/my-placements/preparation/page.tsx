import { Tabs } from "@/components/ui/tabs";
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
  if(!parsed.success) return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title="Invalid preparation filter" />
    <Link href="/learn/my-placements/preparation"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>
  </section>;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"LEARNER")) redirect("/dashboard");
  const data=await getOwnLearnerPlacementPreparation(context,parsed.data);
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Placement preparation"
      description="A checklist of information and activity actually recorded for your account."
      actions={<Link href="/learn/my-placements"
        className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
        My Placements
      </Link>} />
    {(await placementTableExists("placement_tpo_prep_assignments"))?<LearnerPrepAssignmentCards/>:null}
    <section aria-label="Recorded preparation summary"
      className="border-b border-border pb-5">
      <p className="text-sm font-semibold text-foreground">
        {data.recorded} of {data.total} information categories recorded
      </p>
      <p className="mt-2 text-sm text-body">
        This is not a placement eligibility decision, application approval,
        hiring-readiness score, or requirement imposed by your college.
        Missing entries are not treated as failures.
      </p>
    </section>
    <Tabs ariaLabel="Preparation filter" renderPanel={false} value={data.query.view} items={([["ALL","All categories"],["RECORDED","Recorded"],["MISSING","Not recorded"]] as const).map(([view,label])=>({value:view,label,href:learnerPreparationHref({view})}))}/>
    {data.items.length===0 ? <EmptyState title="No categories match"
      description={data.query.view==="MISSING"
        ? "Each tracked category has some recorded information. This does not certify placement readiness."
        : "No categories match this filter. Try All categories."}/>
      : <ol className="grid min-w-0 gap-3 md:grid-cols-2">
        {data.items.map(item=>
          <li key={item.id} className="border-b border-border pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">{item.title}</h2>
              <span className="text-xs font-semibold text-body">
                {item.recorded?"Recorded":"Not recorded"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-body">{item.description}</p>
            <Link href={item.href}
              className="mt-4 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
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
