import {StatusBadge} from "@/components/ui/status-badge";

type Member={membershipId:string;role:string;isPrimary:boolean;displayName:string|null};
type Task={assigneeMembershipId:string|null};

/** Legacy Team at a glance metrics, using tenant-scoped membership identities. */
export function CollegeAdminWorkspaceTeamOverview({members,tasks}:{
 members:readonly Member[];tasks:readonly Task[];
}){
 const learners=members.filter(m=>m.role==="LEARNER");
 const faculty=members.filter(m=>m.role==="MENTOR");
 const primary=faculty.find(m=>m.isPrimary);
 const learnerIds=new Set(learners.map(m=>m.membershipId));
 const assigned=new Set(tasks.map(t=>t.assigneeMembershipId).filter((id):id is string=>
  typeof id==="string"&&learnerIds.has(id)));
 const metrics=[
  {label:"Primary mentor",value:primary?.displayName?.trim()||"—"},
  {label:"Students",value:String(learners.length)},
  {label:"Supporting faculty",value:String(Math.max(0,faculty.length-(primary?1:0)))},
  {label:"Task coverage",value:learners.length?assigned.size+" / "+learners.length+" students assigned work":"No students yet"},
 ];
 return <section aria-label="Team at a glance" className="min-w-0 space-y-3">
  <div>
   <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team at a glance</p>
   <h3 className="mt-1 text-lg font-semibold text-[var(--lms-heading)]">Ownership and workload in one view</h3>
   <p className="mt-1 text-sm text-body">Use the roster below to spot students without assigned work, confirm mentor ownership, and understand who is actively carrying the project.</p>
  </div>
  <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
   {metrics.map(item=><div key={item.label} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-3">
    <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
    <p className="mt-1 break-words text-[15px] font-semibold text-[var(--lms-heading)]">{item.value}</p>
   </div>)}
  </div>
  {!primary?<div role="status" className="border-y border-warning-border bg-warning-subtle px-3 py-3 text-sm">
    <StatusBadge tone="warning">No primary mentor assigned</StatusBadge>
    <p className="mt-1 text-body">Assign a mentor before moving this workspace into an active operating state.</p>
  </div>:null}
 </section>;
}
