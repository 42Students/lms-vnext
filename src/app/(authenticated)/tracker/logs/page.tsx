import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { KnownErrorsWorkspace } from "@/components/tracker/known-errors-workspace";
import { TrackerLiveLogsExplorer } from "@/components/tracker/tracker-live-logs-explorer";
import { TrackerTelegramManualPanel } from "@/components/tracker/tracker-telegram-manual-panel";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
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
        title="Known Errors"
        description="Durable error signatures, recurrence and triage. Cloud Logging collection is an optional, separately configured backup."
      />
      <TrackerAdminNav />
      {!context.adminScope?.collegeId&&!context.adminScope?.organizationId?
        <TrackerLiveLogsExplorer initialQuery={liveQuery}/>:null}
      {!cloudLogPollConfigured() ? (
        <Alert tone="warning">Cloud Logging backup is not configured. In-app errors can still be reported to Telegram.</Alert>
      ) : null}
      {!telegramAlertsConfigured() ? (
        <Alert tone="warning">Telegram alerts are not configured</Alert>
      ) : null}
    </>
  );

  if (context.adminScope?.collegeId || context.adminScope?.organizationId) {
    return (
      <div className="min-w-0 space-y-6">
        {header}
        <ErrorState title="Platform log access is scoped" description="Clear the Super Admin organization/college safety scope to view platform-wide log signatures."/>
      </div>
    );
  }

  if (!logAlertsRuntimeEnabled()) {
    return (
      <div className="min-w-0 space-y-6">
        {header}
        <Alert tone="warning">Known Errors persistence is staged but not enabled. W01 must register and replay the DB10 log-alert tables before this page can read data. This message is not a healthy-log status.</Alert>
      </div>
    );
  }

  if (!parsed.success) {
    return (
      <div className="min-w-0 space-y-6">
        {header}
        <ErrorState title="Invalid log environment." description="Durable error signatures, recurrence and triage. Cloud Logging collection is an optional, separately configured backup."
          action={<Link href="/tracker/logs" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline">
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
    <div className="min-w-0 space-y-6">
      {header}
      <Tabs ariaLabel="Log environment" renderPanel={false} value={environment}
        items={(["PRODUCTION","UAT","DEVELOPMENT"] as const).map(value=>({
          value, label:value, href:"/tracker/logs?environment="+value,
        }))} />
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
