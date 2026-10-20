import Link from "next/link";
import type { getOwnLearnerPlacementAlerts } from "@/modules/placements/learner-placement-alerts-service";
import {learnerAlertsHistoryHref} from "@/modules/placements/learner-alerts-history-navigation-model";
import {learnerAlertSafeDate} from "@/modules/placements/learner-alert-safe-date-model";
import {LearnerPlacementAlertAction} from "./learner-placement-alert-action";

type Alerts = Awaited<ReturnType<typeof getOwnLearnerPlacementAlerts>>;

export function LearnerPlacementAlerts({ alerts, filtered=false, unreadOnly=false }: { alerts: Alerts; filtered?: boolean; unreadOnly?:boolean }) {
  return (
    <section aria-labelledby="learner-placement-alerts"
      className="min-w-0 border-t border-border pt-5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 id="learner-placement-alerts" className="min-w-0 break-words text-base font-semibold text-foreground">
          Your placement alerts
        </h2>
        <Link href={learnerAlertsHistoryHref(unreadOnly)}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline md:min-h-9">
          Personal notification history →
        </Link>
      </div>
      <p className="mt-2 text-sm text-body">
        Your most recent persisted placement-related personal notifications.
        These are not a substitute for official college-wide placement notices or dispute decisions.
      </p>
      {alerts.length === 0 ? (
        <div role="status" className="mt-4 flex min-h-[180px] flex-col items-center justify-center gap-4 px-6 py-12 text-center text-sm leading-[1.5] text-body">
          {filtered ? "No loaded personal placement alerts match this search." : "No personal placement alerts have been delivered to you yet."}{" "}
          This does not establish that your college has published no notices.
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
                  className="shrink-0 text-xs text-muted-foreground">{learnerAlertSafeDate(alert.createdAt).label}</time>
              </div>
              <LearnerPlacementAlertAction id={alert.id} href={alert.actionHref} unread={alert.unread}/>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
