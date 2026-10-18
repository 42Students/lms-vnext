import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
        className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary-text">
        Delivery workspace
      </Link>} />
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Persisted completion checklist</h2>
      <ul className="mt-3 grid gap-2">{items.map(([label,passed])=>
        <li key={label} className="flex items-center justify-between gap-3 text-sm">
          <span>{label}</span><strong>{passed?"Recorded":"Not satisfied"}</strong>
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
