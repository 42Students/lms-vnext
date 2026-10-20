import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {MentorProjectCloseoutControl} from "@/components/projects/mentor-project-closeout-control";
import {getMentorProjectCloseout} from "@/modules/projects/mentor-closeout-service";

export default async function MentorProjectCloseoutPage({
  params,
}:{params:Promise<{projectId:string}>}){
  const {projectId}=await params;
  const context=await getCurrentRequestContext();
  const data=await getMentorProjectCloseout(context,{projectId});
  const items=[
    ["Latest final delivery approved",data.checklist.approvedDelivery],
    ["All registered project tasks Done",data.checklist.tasksDone],
    ["All registered Sprints Completed",data.checklist.sprintsComplete],
    ["All registered Releases Shipped",data.checklist.releasesShipped],
  ] as const;
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Project" title="Project closeout"
      description={data.title+" · Current state "+data.status}
      actions={<Link data-unskin="" href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-[650] text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:py-0 bg-surface hover:bg-primary-subtle hover:border-primary hover:text-primary-text transition-colors duration-150 motion-reduce:transition-none">
        Delivery workspace
      </Link>} />
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Persisted completion checklist</h2>
      <ul className="mt-3 grid gap-2">{items.map(([label,passed])=>
        <li key={label} className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
          <span className="min-w-0 flex-1 break-words">{label}</span><StatusBadge tone={passed?"success":"warning"}>{passed?"Recorded":"Not satisfied"}</StatusBadge>
        </li>)}</ul>
      {!data.checklist.canComplete
        ? <p role="status" className="mt-4 text-sm text-body">
          Completion is unavailable until the latest delivery is approved,
          tasks and Sprints are complete, Releases are shipped, and the project is Active.
          No separate REVIEWED/CLOSED project state is registered.
        </p>
        : <div className="mt-5">
          <MentorProjectCloseoutControl projectId={projectId}
            expectedUpdatedAt={data.expectedUpdatedAt}/>
        </div>}
    </section>
    <p className="text-xs text-muted-foreground">
      This completion records the registered COMPLETED project status and an immutable
      actor audit. It does not create a separate reviewed/closed state or fabricate
      reviewer certification.
    </p>
  </div>;
}
