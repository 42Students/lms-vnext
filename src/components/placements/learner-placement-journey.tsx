import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {ownApplicationJobHref} from "@/modules/placements/learner-application-job-link-model";
import {learnerApplicationCardActivity} from "@/modules/placements/learner-application-card-activity-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

export type LearnerPlacementJourneyItem = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  driveStatus?: string;
  offerStatus?: string | null;
  channel: string;
  staffOptOutUntil?:Date|null;
  mayStaffOptOut?:boolean;
  /** Server-derived withdrawal grant (legacy `a.withdraw`). */
  withdraw?:"SELF"|"REQUEST"|null;
  cancelledReason?:string|null;
  submittedAt: Date;
  withdrawnAt: Date | null;
  screening: {
    status: string;
    candidateMessage: string | null;
    decidedAt: Date | null;
  };
  results: Array<{
    resultId: string;
    roundId?: string;
    roundSequence: number;
    roundName: string;
    outcome: string;
    scorePercent: number | null;
    candidateMessage: string | null;
    appliedAt: Date | null;
  }>;
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

/** Only persisted staff-origin codes qualify; never infer from an application's outcome. */
export function isPlacementCellApplied(channel:string):boolean{
 return ["PLACEMENT_CELL","TPO","STAFF","ON_BEHALF","BULK_ADD","COLLEGE_ADMIN"].includes(channel.trim().toUpperCase());
}
function statusTone(
  value: string,
): "neutral" | "info" | "success" | "warning" | "error" {
  if (
    value === "SHORTLISTED" ||
    value === "PASS" ||
    value === "SUBMITTED"
  ) {
    return "success";
  }
  if (
    value === "REJECTED" ||
    value === "FAIL" ||
    value === "ABSENT"
  ) {
    return "error";
  }
  if (
    value === "UNDER_REVIEW" ||
    value === "HOLD"
  ) {
    return "warning";
  }
  return "neutral";
}

/** Legacy application rows use D MMM; dispute/opt-out deadlines include time. */
function formatWhen(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Kolkata",
  }).format(value);
}

function formatOptOutDeadline(value: Date) {
  const timeZone = "Asia/Kolkata";
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short" }).format(value);
  const date = formatWhen(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(value);
  const part = (kind: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === kind)?.value ?? "";
  return weekday + " " + date + ", " + part("hour") + ":" +
    part("minute") + " " + part("dayPeriod").toUpperCase();
}

/** A status summary derived from persisted application/screening/round facts only. */
function applicationStanding(item:LearnerPlacementJourneyItem){
  if(item.applicationStatus==="WITHDRAWN")return "Withdrawn";
  if(item.screening.status==="REJECTED")return "Not selected";
  const latest=[...item.results].filter(row=>row.appliedAt!==null)
    .sort((a,b)=>b.roundSequence-a.roundSequence)[0];
  if(latest?.outcome==="FAIL")return "Not cleared";
  if(latest?.outcome==="ABSENT")return "Marked absent";
  if(latest?.outcome==="HOLD")return "Waitlisted";
  if(latest?.outcome==="PASS")return "Cleared last recorded round";
  if(item.screening.status==="SHORTLISTED")return "Shortlisted";
  if(item.screening.status==="HOLD")return "Waiting for a decision";
  return "Application received";
}
function roundOutcomeLabel(outcome:string){
  if(outcome==="PASS")return "Cleared";
  if(outcome==="FAIL")return "Not cleared";
  if(outcome==="ABSENT")return "Marked absent";
  if(outcome==="HOLD")return "Waitlisted";
  return humanize(outcome);
}

export type LearnerJourneyScheduledRound = {
  applicationId: string;
  roundId: string;
  roundName: string;
  scheduledAt: string | null;
  mode: string;
  venue: string | null;
  isRescheduled: boolean;
  booked: boolean;
};

export function LearnerPlacementJourney({
  items, scheduledRounds = [],
}: {
  items: readonly LearnerPlacementJourneyItem[];
  scheduledRounds?: readonly LearnerJourneyScheduledRound[];
}) {
  if (items.length === 0) {
    return (
      <section aria-labelledby="learner-journey-heading" className="space-y-3">
        <div>
          <Heading level={2} size="base" id="learner-journey-heading" className="m-0 text-foreground">
            My placement journey
          </Heading>
          <p className="mt-1 text-sm text-body">
            Applications, screening decisions and applied round results will appear here.
          </p>
        </div>
        <EmptyState
          title="No applications yet"
          description="When you apply to a placement opportunity, this becomes your single journey timeline."
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="learner-journey-heading" className="space-y-3">
      <div>
        <Heading level={2} size="base" id="learner-journey-heading" className="m-0 text-foreground">
          My placement journey
        </Heading>
        <p className="mt-1 text-sm text-body">
          One view of your applications, screening state and confirmed round outcomes.
        </p>
      </div>
      <section aria-labelledby="learner-journey-summary" className="space-y-3 border-b border-border pb-5">
        <Heading level={3} size="base" id="learner-journey-summary" className="text-foreground">Where your applications stand</Heading>
        <p className="text-sm text-body">Your recorded application and selection progress. Future rounds only appear after your placement team records them.</p>
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          {items.map(item=>(
            <TextLink variant="bare" key={item.applicationId} href={"#placement-application-"+encodeURIComponent(item.applicationId)}
              className="block min-h-11 min-w-0 rounded-xl border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:shadow-(--lms-elevation-1) focus-ring motion-reduce:transition-none md:min-h-[var(--lms-control-height)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words text-sm font-semibold text-foreground">{item.companyName} · {item.jobTitle}</span>
                <StatusBadge tone={item.applicationStatus==="WITHDRAWN"||item.screening.status==="REJECTED"?"error":"info"}>
                  {applicationStanding(item)}
                </StatusBadge>
              </div>
              <ol className="mt-3 flex flex-wrap gap-2 text-xs text-body">
                <li className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1">Applied</li>
                <li className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1">Screening: {humanize(item.screening.status)}</li>
                {[...item.results].sort((a,b)=>a.roundSequence-b.roundSequence).map(result=>(
                  <li key={result.resultId} className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1">
                    {result.roundName}: {result.appliedAt?roundOutcomeLabel(result.outcome):"Awaiting confirmation"}
                  </li>
                ))}
              </ol>
            </TextLink>
          ))}
        </div>
      </section>
      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.applicationId}
            id={"placement-application-"+encodeURIComponent(item.applicationId)}
            className="scroll-mt-24 min-w-0 rounded-xl border border-border bg-surface p-4 md:p-6"
          >
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="m-0 break-words text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  {item.companyName}
                </p>
                <Heading level={3} size="lg" className="mt-1 break-words text-foreground">
                  {item.jobTitle}
                </Heading>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied{" "}
                  {formatWhen(
                    item.submittedAt,
                  )}{" "}
                  · {isPlacementCellApplied(item.channel) ? "Applied by the placement cell" : humanize(item.channel)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={statusTone(
                    item.applicationStatus,
                  )}
                >
                  {humanize(
                    item.applicationStatus,
                  )}
                </StatusBadge>
                <StatusBadge
                  tone={statusTone(
                    item.screening.status,
                  )}
                >
                  {humanize(
                    item.screening.status,
                  )}
                </StatusBadge>
              </div>
            </div>

            {isPlacementCellApplied(item.channel) && item.applicationStatus==="SUBMITTED" ? (
              <aside aria-label="Application submitted by placement cell" className="mt-4 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4">
                <p className="font-semibold text-foreground">The placement cell applied for you</p>
                <p className="mt-1 text-sm text-body">
                  If you don&apos;t want this one, withdraw before {formatOptOutDeadline(item.staffOptOutUntil??new Date(item.submittedAt.getTime()+48*60*60*1000))}.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">The placement cell applied on your behalf. The 48-hour opt-out window starts when the application was recorded. Outside that window, contact the placement team about withdrawal.</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {item.mayStaffOptOut?<TextLink href={"/learn/my-placements/applications?applicationId="+encodeURIComponent(item.applicationId)}
                    className="inline-flex min-h-11 md:min-h-9 items-center">
                    Opt out or ask to withdraw
                  </TextLink>:null}
                  <TextLink href="/learn/my-placements/placement#requests"
                    className="inline-flex min-h-11 md:min-h-9 items-center">
                    Contact the placement cell
                  </TextLink>
                </div>
              </aside>
            ) : null}
            {item.driveStatus === "CANCELLED" ? (
              <aside role="alert" className="mt-4 rounded-lg border border-warning bg-surface p-4">
                <p className="font-semibold text-foreground">This drive was cancelled</p>
                <p className="mt-1 text-sm text-body">The placement cell has cancelled this drive. Any published reason will appear in its college notice. Your application history remains available.</p>
                <TextLink href="/learn/my-placements/announcements" className="mt-2 inline-flex min-h-11 md:min-h-9 items-center">Check placement cell notices</TextLink>
              </aside>
            ) : item.driveStatus === "CLOSED" ? (
              <p role="status" className="mt-4 rounded-lg border border-border p-3 text-sm text-body">This drive has closed. Your recorded application and round results remain available.</p>
            ) : null}
            {item.screening
              .candidateMessage ? (
              <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[.05em] text-muted-foreground">
                  Placement team
                </p>
                <p className="mt-1 text-sm leading-6 text-body">
                  {
                    item.screening
                      .candidateMessage
                  }
                </p>
              </div>
            ) : null}

            {scheduledRounds.some(round=>round.applicationId===item.applicationId) ? (
              <section aria-label="Your selection process" className="mt-4 rounded-lg border border-border p-3">
                <Heading level={4} className="text-foreground">Selection process</Heading>
                <p className="mt-1 text-xs text-body">Scheduled rounds and your individual booking are different records.</p>
                <ol className="mt-3 space-y-2">
                  {scheduledRounds.filter(round=>round.applicationId===item.applicationId).map(round=>(
                    <li key={round.roundId} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-subtle p-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{round.roundName}</p>
                        <p className="text-xs text-body">{round.scheduledAt
                          ? new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(round.scheduledAt))+" IST"
                          : "Date to be told"} · {round.mode.replaceAll("_"," ").toLowerCase()}</p>
                        <p className="text-xs text-body">{round.venue??"Venue to be told"}
                          {round.isRescheduled?" · You asked to reschedule":""}</p>
                      </div>
                      <StatusBadge tone={round.booked?"success":"neutral"}>{round.booked?"Booked":"Up next"}</StatusBadge>
                    </li>
                  ))}
                </ol>
                <TextLink href="/learn/my-placements/schedule" className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-sm">View schedule</TextLink>
              </section>
            ) : null}

            {item.results.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {item.results
                  .slice()
                  .sort(
                    (left, right) =>
                      left.roundSequence -
                      right.roundSequence,
                  )
                  .map((result) => (
                    <div
                      key={result.resultId}
                      className="flex min-w-0 flex-col gap-2 border-b border-border py-3 last:border-b-0 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="m-0 text-sm font-semibold text-foreground">
                          Round{" "}
                          {
                            result.roundSequence
                          }{" "}
                          · {result.roundName}
                        </p>
                        {result.candidateMessage ? (
                          <p className="mt-1 text-xs leading-5 text-body">
                            {
                              result.candidateMessage
                            }
                          </p>
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {result.scorePercent !==
                        null ? (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {
                              result.scorePercent
                            }
                            %
                          </span>
                        ) : null}
                        <StatusBadge
                          tone={statusTone(
                            result.outcome,
                          )}
                        >
                          {roundOutcomeLabel(result.outcome)}
                        </StatusBadge>
                        {result.outcome==="ABSENT"&&result.appliedAt&&result.roundId ? (
                          <TextLink
                            href={"/learn/my-placements/placement?"+new URLSearchParams({
                              request:"absence-dispute",applicationId:item.applicationId,
                              roundId:result.roundId,
                            }).toString()+"#requests"}
                            className="inline-flex min-h-11 md:min-h-9 items-center">
                            Wrong? Tell the placement cell
                          </TextLink>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No applied round results yet.
              </p>
            )}

            {item.withdrawnAt ? (
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                Withdrawn{" "}
                {formatWhen(
                  item.withdrawnAt,
                )}
              </p>
            ) : null}
            <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-subtle p-3">
              <p className="text-xs text-body">
                Last recorded activity · {formatWhen(learnerApplicationCardActivity(item).at)}
              </p>
              {learnerApplicationCardActivity(item).historyHref ? (
                <TextLink href={learnerApplicationCardActivity(item).historyHref!}
                  className="inline-flex min-h-11 md:min-h-9 items-center text-sm">
                  Saved status history →
                </TextLink>
              ):null}
            </div>
            {ownApplicationJobHref(item.jobId) ? <TextLink
              href={ownApplicationJobHref(item.jobId)!}
              className="mt-4 mr-4 inline-flex min-h-11 md:min-h-9 items-center text-sm">
              View published job and role options →
            </TextLink> : null}
            <TextLink
              href={`/learn/my-placements/applications?applicationId=${encodeURIComponent(item.applicationId)}`}
              className="mt-4 inline-flex min-h-11 md:min-h-9 w-full items-center justify-center text-sm md:w-auto md:justify-start"
            >
              View application details →
            </TextLink>
          </article>
        ))}
      </div>
    </section>
  );
}
