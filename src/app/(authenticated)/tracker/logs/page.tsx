import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { KnownErrorsWorkspace } from "@/components/tracker/known-errors-workspace";
import { TrackerLiveLogsExplorer } from "@/components/tracker/tracker-live-logs-explorer";
import { TrackerTelegramManualPanel } from "@/components/tracker/tracker-telegram-manual-panel";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { isSuperAdmin } from "@/modules/identity/context";
import {
  listKnownErrorsForAdmin,
  readLogAlertAdminState,
} from "@/modules/log-alerts/admin-service";
import { cloudLogPollConfigured, logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";
import { telegramAlertsConfigured } from "@/modules/log-alerts/telegram-notifier";
import { knownErrorListSchema } from "@/modules/log-alerts/validation";

export const dynamic = "force-dynamic";

export default async function TrackerLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ environment?: string; query?: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
      context.adminScope?.organizationId) redirect("/dashboard");
  const search=await searchParams;
  const environment = search.environment ?? "PRODUCTION";
  const liveQuery=typeof search.query==="string"?search.query.slice(0,150):"";
  const parsed = knownErrorListSchema.safeParse({ environment, limit: 40 });

  const header = (
    <>
      <PageHeader
        eyebrow="42 Tracker"
        title="Known Errors"
        description="Durable error signatures, recurrence and triage. Cloud Logging collection is an optional, separately configured backup."
      />
      <TrackerAdminNav />
      {!context.adminScope?.collegeId&&!context.adminScope?.organizationId?
        <TrackerLiveLogsExplorer initialQuery={liveQuery}/>:null}
      {!cloudLogPollConfigured() ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
          Cloud Logging backup is not configured. In-app errors can still be reported to Telegram.
        </p>
      ) : null}
      {!telegramAlertsConfigured() ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
          Telegram alerts are not configured
        </p>
      ) : null}
    </>
  );

  if (context.adminScope?.collegeId || context.adminScope?.organizationId) {
    return (
      <div className="space-y-6">
        {header}
        <p role="alert" className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
          Clear the Super Admin organization/college safety scope to view platform-wide log signatures.
        </p>
      </div>
    );
  }

  if (!logAlertsRuntimeEnabled()) {
    return (
      <div className="space-y-6">
        {header}
        <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
          Known Errors persistence is staged but not enabled. W01 must register
          and replay the DB10 log-alert tables before this page can read data.
          This message is not a healthy-log status.
        </p>
      </div>
    );
  }

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState title="Invalid log environment." description="Durable error signatures, recurrence and triage. Cloud Logging collection is an optional, separately configured backup."
          action={<Link href="/tracker/logs" className="inline-flex min-h-[var(--lms-control-height)] items-center font-semibold text-primary-text underline">
            Reset filter
          </Link>}/>
      </div>
    );
  }

  const [items, state] = await Promise.all([
    listKnownErrorsForAdmin(context, parsed.data),
    readLogAlertAdminState(context),
  ]);

  return (
    <div className="space-y-6">
      {header}
      <nav aria-label="Log environment" className="flex flex-wrap gap-3 border-b border-border">
        {(["PRODUCTION", "UAT", "DEVELOPMENT"] as const).map((value) => (
          <Link
            key={value}
            href={"/tracker/logs?environment=" + value}
            aria-current={environment === value ? "page" : undefined}
            className={
              "inline-flex min-h-[var(--lms-control-height)] items-center border-b-[3px] px-3 py-2 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] " +
              (environment === value
                ? "border-primary text-foreground"
                : "border-transparent text-body hover:text-primary-text")
            }
          >
            {value}
          </Link>
        ))}
      </nav>
      <TrackerTelegramManualPanel items={items} configured={telegramAlertsConfigured()}
        deploy={/^[0-9a-f]{7,64}$/i.test(process.env.DEPLOY_COMMIT??"")
          ?process.env.DEPLOY_COMMIT??null:null} />
      <KnownErrorsWorkspace items={items} lastViewedAt={state.adminLastViewedAt} />
      {items.length === 40 ? (
        <p className="text-xs text-muted-foreground">
          Showing the most recent 40 signatures. Historical pagination is not yet implemented.
        </p>
      ) : null}
    </div>
  );
}
