import { Tabs } from "@/components/ui/tabs";
import Link from "next/link";
import {LearnerPrepAssignmentCards} from "@/components/placements/learner-prep-assignment-cards";
import {placementTableExists} from "@/modules/placements/staged-tables";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { AuthorizationError } from "@/modules/permissions/policy";
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
  if(!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement preparation" />
    <ErrorState title="Invalid preparation filter" description="Choose a valid preparation category." action={<Link href="/learn/my-placements/preparation" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>}/>
  </div>;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"LEARNER")) redirect("/dashboard");
  let data:Awaited<ReturnType<typeof getOwnLearnerPlacementPreparation>>;
  try {
    data=await getOwnLearnerPlacementPreparation(context,parsed.data);
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement preparation" />
      <ErrorState title="Could not load placement preparation"
        description="Your recorded preparation categories could not be loaded; no missing entries are assumed."
        action={<Link href={learnerPreparationHref(parsed.data)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry preparation</Link>} />
    </div>;
  }
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Placement preparation"
      description="A checklist of information and activity actually recorded for your account."
      actions={<Link href="/learn/my-placements"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
        My Placements
      </Link>} />
    {(await placementTableExists("placement_tpo_prep_assignments"))?<LearnerPrepAssignmentCards/>:null}
    <section aria-label="Recorded preparation summary"
      className="border-b border-border pb-4">
      <p className="text-sm font-semibold text-foreground leading-[22px]">
        {data.recorded} of {data.total} information categories recorded
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-[22px] text-body">
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
      : <ol className="min-w-0 divide-y divide-border">
        {data.items.map(item=>
          <li key={item.id} className="min-w-0 py-4 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="min-w-0 break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{item.title}</h2>
              <StatusBadge tone={item.recorded?"success":"neutral"}>{item.recorded?"Recorded":"Not recorded"}</StatusBadge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-[22px] text-body">{item.description}</p>
            <Link href={item.href}
              className="mt-2 inline-flex min-h-11 items-center break-words text-sm font-semibold text-primary-text underline-offset-2 hover:underline md:min-h-9">
              {item.recorded?"Review recorded information":"Review this section"} →
            </Link>
          </li>)}
        </ol>}
    <p className="text-xs text-muted-foreground leading-[1.6]">
      This view uses registered current college enrollment, Learner profile
      and application history. It does not show private identification values,
      infer eligibility, submit applications, or send notifications.
    </p>
  </div>;
}
