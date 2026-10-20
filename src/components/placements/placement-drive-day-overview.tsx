import { StatusBadge } from "@/components/ui/status-badge";
import {DataTable} from "@/components/ui/data-table";
import type { getPlacementDriveDay } from "@/modules/placements/drive-day-service";

type DriveDay = Awaited<ReturnType<typeof getPlacementDriveDay>>;
function tone(status: string): "neutral" | "info" | "success" | "warning" | "error" {
  if (status === "COMPLETED" || status === "APPLIED") return "success";
  if (status === "ACTIVE" || status === "SCHEDULED") return "info";
  if (status === "PLANNED" || status === "PENDING") return "warning";
  return "neutral";
}
function formatWhen(value: Date | null, timezone: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: timezone ?? "Asia/Kolkata" }).format(value);
}
export function PlacementDriveDayOverview({ driveDay }: { driveDay: DriveDay }) {
  return <div className="space-y-6">
    <section className="border-b border-border pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">{driveDay.job.company.name}</p><h2 className="mt-1 text-xl font-semibold text-foreground">{driveDay.job.title}</h2></div>
        <StatusBadge tone={tone(driveDay.driveStatus)}>{driveDay.driveStatus.toLowerCase().split("_").join(" ")}</StatusBadge>
      </div>
      <div className="mt-5 grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-2 xl:grid-cols-4">
        {[["Applications", driveDay.summary.submittedApplications],["Needs screening", driveDay.summary.pendingScreening],["Shortlisted", driveDay.summary.shortlisted],["Rounds", driveDay.summary.roundCount]].map(([label,value]) =>
          <div key={String(label)} className="border-b border-border px-4 py-3 last:border-b-0 md:border-r md:last:border-r-0 xl:border-b-0"><p className="m-0 text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-foreground">{value}</p></div>)}
      </div>
    </section>
    {driveDay.attention.length > 0 ? <section className="border-b border-border"><div className="border-b border-border px-5 py-4"><h2 className="m-0 text-base font-semibold text-foreground">Attention</h2></div><div className="flex flex-wrap gap-2 p-5">{driveDay.attention.map((item,index) =>
      <StatusBadge key={String(item.code)+index} tone={item.code === "RESULTS_OVERDUE" || item.code === "INACTIVE_CANDIDATES" ? "error" : "warning"}>{String(item.code).toLowerCase().split("_").join(" ")}{typeof item.count === "number" ? " · "+item.count : ""}</StatusBadge>)}</div></section> : null}
    <section className="space-y-3">
      <div><h2 className="m-0 text-base font-semibold text-foreground">Round pipeline</h2><p className="mt-1 text-sm text-body">Progression is derived from applied results, never staged drafts.</p></div>
      {driveDay.rounds.length === 0 ? <div className="border-b border-border py-5 text-sm text-muted-foreground">Evaluation rounds are not configured yet.</div> :
        driveDay.rounds.map(round => <article key={round.id} id={`round-${round.id}`} className="scroll-mt-24 border-b border-border py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Round {round.sequence} · {round.kind}</p><h3 className="mt-1 text-lg font-semibold text-foreground">{round.name}</h3><p className="mt-1 text-sm text-body">{formatWhen(round.scheduledAt, round.timezone)}{round.venue ? " · "+round.venue : ""}</p></div><StatusBadge tone={tone(round.status)}>{round.status}</StatusBadge></div>
          <div className="mt-4 grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-2 xl:grid-cols-5">{[["Participants",round.participantCount],["Staged",round.stagedResultCount],["Applied",round.appliedResultCount],["Missing",round.missingResultCount],["Passed",round.outcomes.pass]].map(([label,value]) => <div key={String(label)} className="border-b border-border p-3 last:border-b-0 md:border-r md:last:border-r-0 xl:border-b-0"><p className="m-0 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>)}</div>
          {round.participants.length > 0 ?
           <div className="mt-4">
            <DataTable
             caption={"Round "+round.sequence+" candidate progress"}
             rows={round.participants}
             getRowKey={participant=>participant.applicationId}
             columns={[
              {key:"candidate",header:"Candidate",mobilePriority:"primary",cell:participant=><>
               <p className="m-0 font-semibold text-foreground">{participant.displayName??"Learner"}</p>
               <p className="mt-1 break-words text-xs text-muted-foreground">
                {participant.roleTitle} · {participant.email??participant.phoneE164??"No contact on profile"}
               </p>
              </>},
              {key:"membership",header:"Membership",mobilePriority:"secondary",cell:participant=>
               <StatusBadge tone={participant.membershipStatus==="ACTIVE"?"success":"error"}>{participant.membershipStatus}</StatusBadge>},
              {key:"schedule",header:"Schedule",mobilePriority:"secondary",cell:participant=>
               participant.scheduleException?<div>
                <StatusBadge tone="info">Exception</StatusBadge>
                <p className="mt-1 text-xs text-body">
                 {formatWhen(participant.scheduleException.scheduledAt,participant.scheduleException.timezone)}
                 {participant.scheduleException.venue?" · "+participant.scheduleException.venue:""}
                </p>
               </div>:<span className="text-muted-foreground">Shared round</span>},
              {key:"result",header:"Result",mobilePriority:"secondary",cell:participant=>
               participant.result?<StatusBadge tone={participant.result.status==="STAGED"?"warning":
                participant.result.outcome==="PASS"?"success":"error"}>
                {participant.result.status} · {participant.result.outcome}
               </StatusBadge>:<span className="text-muted-foreground">Pending</span>},
             ]}
             empty={<p role="status" className="text-body">No candidates in this round.</p>}
            />
           </div>:null}
        </article>)}
    </section>
  </div>;
}
