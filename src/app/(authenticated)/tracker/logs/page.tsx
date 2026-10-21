import Link from "next/link";
import type { Metadata } from "next";
import { Tabs } from "@/components/ui/tabs";

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

function LockKeyhole({className = ""}: {className?: string}) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={26} height={26}
    className={className} fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round">
    <rect x={4.5} y={10} width={15} height={11} rx={2}/>
    <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    <circle cx={12} cy={15.5} r={1}/>
  </svg>;
}

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Logs · 42 Tracker" };

export default async function TrackerLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ environment?: string; query?: string; insertId?: string; logName?: string }>;
}) {
  // Logs are platform-wide and can contain operational identifiers. A named,
  // unscoped Super Admin session is required; never recreate the old shared
  // password endpoint that silently granted a full Super Admin session.
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
      context.adminScope?.organizationId) {
    // The retired password-only gate must never become a privilege escalation.
    // Retain its recognizable entry point and direct staff to named SSO.
    return <section className="mx-auto max-w-[480px] space-y-4 rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-6 text-center">
      <LockKeyhole className="mx-auto text-muted-foreground" />
      <PageHeader title="Logs access" description="Sign in with an authorized Super Admin account to view backend logs." />
      <p className="text-sm text-muted-foreground">Access is tied to a named account and its current permissions; the old shared password is no longer accepted.</p>
      <Link href="/login?next=%2Ftracker%2Flogs"
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--lms-button-primary-hover)]">
        Sign in to view logs
      </Link>
    </section>;
  }

  const search = await searchParams;
  const environment = search.environment ?? "PRODUCTION";
  const legacyReference = typeof search.insertId === "string" ? search.insertId :
    typeof search.logName === "string" ? search.logName : "";
  const liveQuery = typeof search.query === "string"
    ? search.query.slice(0, 150) : legacyReference.slice(0, 150);
  const parsed = knownErrorListSchema.safeParse({ environment, limit: 40 });
  const alertsReady = logAlertsRuntimeEnabled();
  const pollingReady = cloudLogPollConfigured();
  const telegramReady = telegramAlertsConfigured();
  const commit = process.env.DEPLOY_COMMIT ?? "";
  const deploy = /^[0-9a-f]{7,64}$/i.test(commit) ? commit : null;
  const startedRaw = process.env.DEPLOY_STARTED_AT ?? "";
  const backendStartedAt = startedRaw && Number.isFinite(Date.parse(startedRaw))
    ? new Date(startedRaw).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })
    : null;

  const header = (
    <>
      <PageHeader
        eyebrow="42 Logs"
        title="Logs"
        description="What the backend is telling us, and what to do about it."
      />
      <TrackerAdminNav />
    </>
  );

  if (!parsed.success) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <ErrorState title="Invalid log environment." description="Choose Production, Development or UAT."
          action={<Link href="/tracker/logs" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Reset filter</Link>} />
      </div>
    );
  }

  // The Cloud Logging workbench must remain usable even when the independent
  // DB10 Known Errors persistence feature has not been enabled by operations.
  const knownErrors = alertsReady
    ? await Promise.all([
        listKnownErrorsForAdmin(context, parsed.data),
        readLogAlertAdminState(context),
      ])
    : null;
  const items = knownErrors?.[0] ?? [];
  const lastViewedAt = knownErrors?.[1].adminLastViewedAt ?? null;
  const newSinceLastVisit = lastViewedAt
    ? items.filter(item => item.lastSeenAt.getTime() > lastViewedAt.getTime()).length
    : 0;

  return (
    <div className="min-w-0 space-y-5">
      {header}
      <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Platform logs · Named Super Admin access</span>
        {deploy ? <span className="rounded-full border border-[var(--lms-canvas-border)] px-3 py-1">Deploy {deploy.slice(0, 8)}</span> : null}
        {backendStartedAt ? <span>Backend started {backendStartedAt} IST</span> : null}
        <span>{pollingReady ? "Cloud log collection enabled" : "Cloud log collection not configured"}</span>
      </div>
      <Tabs ariaLabel="Log environment" renderPanel={false} value={environment}
        items={(["PRODUCTION", "DEVELOPMENT", "UAT"] as const).map(value => ({
          value, label: value, href: "/tracker/logs?environment=" + value,
        }))} />
      <p className="text-xs text-muted-foreground">Showing Production, Development or UAT. Default window: last hour · Warning and above. Group similar is on; automatic refresh is off.</p>
      {legacyReference ? <Alert tone="info">Opened a legacy log link. Search is filtered to its record reference; older records may have expired.</Alert> : null}
      {newSinceLastVisit > 0 ? (
        <Alert tone="info">{newSinceLastVisit}{items.length === 40 ? "+" : ""} new tracked error {newSinceLastVisit === 1 ? "signature" : "signatures"} since your last review.</Alert>
      ) : null}
      <nav aria-label="Log tools" className="flex flex-wrap items-center gap-3 text-sm">
        <a href="#known-errors" className="font-semibold text-primary-text underline">Known errors</a>
        <a href="#telegram-alert-tools" className="font-semibold text-primary-text underline">Alert digest</a>
      </nav>
      <TrackerLiveLogsExplorer initialQuery={liveQuery} />
      {!pollingReady ? (
        <Alert tone="warning">Cloud Logging polling is not configured for this deployment. The live source may be unavailable; this is not a healthy-log result.</Alert>
      ) : null}
      <section className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4" aria-label="Known errors">
         <p className="text-sm text-body">Durable signatures, recurrence, acknowledgements and triage are kept separate from the live log feed.</p>
         {knownErrors ? <>
           <KnownErrorsWorkspace items={items} lastViewedAt={lastViewedAt} backendStartedAt={backendStartedAt}/>
           {items.length===40?<p className="text-xs leading-5 text-muted-foreground">Showing the 40 most recent signatures; live logs can contain more events.</p>:null}
         </> : <Alert tone="warning">Known errors persistence is not enabled or its migration replay has not been verified. This does not mean there are no errors. Live logging above remains available independently.</Alert>}
       </section>
       <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <summary id="telegram-alert-tools" className="flex min-h-11 cursor-pointer items-center text-[16px] font-semibold text-[var(--lms-heading)] md:min-h-9">Telegram alert tools</summary>
        <div className="min-w-0 space-y-3 pt-3">
          {knownErrors ? (
            <TrackerTelegramManualPanel items={items} configured={telegramReady} deploy={deploy} />
          ) : (
            <Alert tone="warning">Telegram digest tools require verified Known errors persistence.</Alert>
          )}
          {!telegramReady ? <Alert tone="info">Telegram alerts are not configured.</Alert> : null}
        </div>
      </details>
    </div>
  );
}
