import Link from "next/link";
import type { getOwnLearnerPlacementAlerts } from "@/modules/placements/learner-placement-alerts-service";
import {learnerAlertsHistoryHref} from "@/modules/placements/learner-alerts-history-navigation-model";
import {learnerAlertSafeDate,learnerAlertRelativeDay} from "@/modules/placements/learner-alert-safe-date-model";
import {LearnerPlacementAlertAction} from "./learner-placement-alert-action";

type Alerts = Awaited<ReturnType<typeof getOwnLearnerPlacementAlerts>>;
type RestrictionNotice={active:true;untilDate:string|null;remainingDrives:number|null};

export function LearnerPlacementAlerts({ alerts, filtered=false, unreadOnly=false, restriction=null }: {
 alerts: Alerts; filtered?: boolean; unreadOnly?:boolean; restriction?:RestrictionNotice|null;
}) {
  return (
    <section aria-labelledby="learner-placement-alerts"
      className="min-w-0 border-t border-border pt-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 id="learner-placement-alerts" className="min-w-0 break-words font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          Your placement alerts
        </h2>
        <Link href={learnerAlertsHistoryHref(unreadOnly)}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Personal notification history →
        </Link>
      </div>
      <p className="mt-2 text-sm text-body leading-[22px]">
        Your most recent persisted placement-related personal notifications.
        These are not a substitute for official college-wide placement notices or dispute decisions.
      </p>
      {restriction?.active?<aside aria-label="Placement restriction" role="status"
        className="mt-4 border-l-4 border-warning bg-muted px-4 py-3 text-sm leading-[22px]">
        <p className="font-semibold">Placement restriction active</p>
        {restriction.untilDate?<p>Restricted until {restriction.untilDate} (IST).</p>:null}
        {restriction.remainingDrives!==null?<p>Remaining drive restrictions: {restriction.remainingDrives}.</p>:null}
        <p>Contact your placement cell to review the reason or request a dispute.</p>
      </aside>:null}
      {alerts.length === 0 ? (
        <div role="status" className="mt-4 flex min-h-40 flex-col items-center justify-center gap-3 px-3 py-6 text-center text-sm leading-6 text-body">
          {filtered ? "No loaded personal placement alerts match this search." :
            "No updates yet. When a round is booked, an offer comes in or your application moves, it shows here."}
          <p className="text-xs text-muted-foreground">This does not establish that your college has published no notices.</p>
        </div>
      ) : (
        <ol className="mt-4 divide-y divide-border">
          {alerts.map((alert) => (
            <li key={alert.id} className="min-w-0 py-4 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-[length:var(--lms-font-base)] font-semibold leading-[1.3] text-foreground md:text-[length:var(--lms-font-md)]">
                    {alert.title}

                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[length:var(--lms-font-sm)] leading-[1.5] text-body md:text-[length:var(--lms-font-base)]">{alert.body}</p>
                </div>
                <time dateTime={learnerAlertSafeDate(alert.createdAt).iso??undefined}
                  className="shrink-0 text-xs text-muted-foreground leading-5">{learnerAlertRelativeDay(alert.createdAt)}</time>
              </div>
              <LearnerPlacementAlertAction id={alert.id} href={alert.actionHref} unread={alert.unread}/>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
