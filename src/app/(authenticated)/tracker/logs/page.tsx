import type { Metadata } from "next";
import { Tabs } from "@/components/ui/tabs";

import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema/activity";
import { KnownErrorsWorkspace } from "@/components/tracker/known-errors-workspace";
import { TrackerLiveLogsExplorer } from "@/components/tracker/tracker-live-logs-explorer";
import { TrackerTelegramManualPanel } from "@/components/tracker/tracker-telegram-manual-panel";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
import { isSuperAdmin } from "@/modules/identity/context";
import {
  pageKnownErrorsForAdmin,
  readLogAlertAdminState,
} from "@/modules/log-alerts/admin-service";
import { cloudLogPollConfigured, logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";
import { telegramAlertsConfigured } from "@/modules/log-alerts/telegram-notifier";
import { knownErrorListSchema } from "@/modules/log-alerts/validation";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTimeIst } from "@/lib/format-date";
import { Disclosure } from "@/components/ui/disclosure";

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
  searchParams: Promise<{ environment?: string; query?: string; insertId?: string; logName?: string; detail?: string; knownOffset?: string }>;
}) {
  // Logs are platform-wide and can contain operational identifiers. A named,
  // unscoped Super Admin session is required; never recreate the old shared
  // password endpoint that silently granted a full Super Admin session.
  const context = await getCurrentRequestContext();
  if (context.user.platformStatus !== "ACTIVE" || !isSuperAdmin(context) ||
      context.adminScope?.collegeId || context.adminScope?.organizationId) {
    // Preserve the legacy denied-attempt audit with a named actor rather than
    // its unauthenticated source IP. Never store query terms or sensitive logs.
    // This route is already inside the authenticated workspace boundary.
    await getDb().insert(activityEvents).values({
      actorUserId: context.user.id,
      module: "PLATFORM",
      eventType: "platform.tracker.logs_access_denied",
      subjectType: "tracker_logs",
      subjectId: "live-explorer",
      summary: "Tracker log explorer access denied",
      metadata: { access: "named_account", outcome: "denied" },
    });
    // The retired password-only gate must never become a privilege escalation.
    // Retain its recognizable entry point and direct staff to named SSO.
    return <section className="mx-auto max-w-[480px] space-y-4 rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-6 text-center">
      <LockKeyhole className="mx-auto text-muted-foreground" />
      <PageHeader title="Logs access" description="Sign in with an authorized Super Admin account to view backend logs." />
      <p className="text-sm text-muted-foreground">Access is tied to a named account and its current permissions; the old shared password is no longer accepted.</p>
      <ButtonLink variant="primary" href="/login?next=%2Ftracker%2Flogs">
        Sign in to view logs
      </ButtonLink>
    </section>;
  }

  // Unlike the old password-only IP log, every successful log explorer read
  // has a durable named actor. Never include raw log queries, IPs, headers,
  // tokens, credentials or private log contents in this audit payload.
  // Fail closed if this write fails rather than exposing unaudited logs.
  await getDb().insert(activityEvents).values({
    actorUserId: context.user.id,
    module: "PLATFORM",
    eventType: "platform.tracker.logs_viewed",
    subjectType: "tracker_logs",
    subjectId: "live-explorer",
    summary: "Tracker log explorer accessed",
    metadata: { access: "named_super_admin" },
  });
  const search = await searchParams;
  const environment = search.environment ?? "PRODUCTION";
  const legacyReference = typeof search.insertId === "string" ? search.insertId :
    typeof search.logName === "string" ? search.logName : "";
  const liveQuery = typeof search.query === "string"
    ? search.query.slice(0, 150) : legacyReference.slice(0, 150);
  const offsetRaw = search.knownOffset ?? "0";
  const knownOffset = /^\d{1,6}$/.test(offsetRaw) ? Number(offsetRaw) : Number.NaN;
  const parsed = knownErrorListSchema.safeParse({ environment, limit: 40 });
  const alertsReady = logAlertsRuntimeEnabled();
  const pollingReady = cloudLogPollConfigured();
  const telegramReady = telegramAlertsConfigured();
  const commit = process.env["DEPLOY_COMMIT"] ?? "";
  const deploy = /^[0-9a-f]{7,64}$/i.test(commit) ? commit : null;
  const startedRaw = process.env["DEPLOY_STARTED_AT"] ?? "";
  const backendStartedAt = startedRaw && Number.isFinite(Date.parse(startedRaw))
    ? formatDateTimeIst(new Date(startedRaw))
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

  if (!parsed.success || !Number.isSafeInteger(knownOffset) || knownOffset > 100000) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <ErrorState title="Invalid log environment." description="Choose Production, Development or UAT."
          action={<TextLink href="/tracker/logs" className="inline-flex min-h-11 items-center md:min-h-9">Reset filter</TextLink>} />
      </div>
    );
  }

  // The Cloud Logging workbench must remain usable even when the independent
  // DB10 Known Errors persistence feature has not been enabled by operations.
  const knownErrors = alertsReady
    ? await Promise.all([
        pageKnownErrorsForAdmin(context, { ...parsed.data, offset: knownOffset }),
        readLogAlertAdminState(context),
      ])
    : null;
  const knownPage = knownErrors?.[0] ?? null;
  const items = knownPage?.items ?? [];
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
      <nav aria-label="Log tools" className="flex min-w-0 flex-wrap items-center gap-3 text-sm [&_a]:min-h-11 [&_a]:inline-flex [&_a]:items-center">
        <TextLink href="#known-errors">Known errors</TextLink>
        <TextLink href="#telegram-alert-tools">Alert digest</TextLink>
      </nav>
      <TrackerLiveLogsExplorer initialQuery={liveQuery} initialDetailId={typeof search.detail==="string"?search.detail.slice(0,1024):""} />
      {!pollingReady ? (
        <Alert tone="warning">Cloud Logging polling is not configured for this deployment. The live source may be unavailable; this is not a healthy-log result.</Alert>
      ) : null}
      <section id="known-errors" className="min-w-0 scroll-mt-24 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4" aria-label="Known errors">
         <p className="text-sm text-body">Durable signatures, recurrence, acknowledgements and triage are kept separate from the live log feed.</p>
         {knownErrors ? <>
           <KnownErrorsWorkspace items={items} lastViewedAt={lastViewedAt} backendStartedAt={backendStartedAt}/>
           {knownPage ? <nav aria-label="Known error history pages" className="flex flex-wrap items-center gap-4 text-sm">
             <span>Showing {knownPage.total === 0 ? 0 : knownPage.offset + 1}–{knownPage.offset + items.length} of {knownPage.total} saved signatures</span>
             {knownPage.offset > 0 ? <TextLink href={`/tracker/logs?environment=${environment}&knownOffset=${Math.max(0,knownPage.offset-40)}`}>Newer signatures</TextLink> : null}
             {knownPage.hasMore && knownPage.nextOffset !== null ? <TextLink href={`/tracker/logs?environment=${environment}&knownOffset=${knownPage.nextOffset}`}>Older signatures</TextLink> : null}
           </nav> : null}
         </> : <Alert tone="warning">Known errors persistence is not enabled or its migration replay has not been verified. This does not mean there are no errors. Live logging above remains available independently.</Alert>}
       </section>
       <Disclosure title="Telegram alert tools" summaryProps={{ id: "telegram-alert-tools" }} className="min-w-0">
        <div className="min-w-0 space-y-3 pt-3">
          {knownErrors ? (
            <TrackerTelegramManualPanel items={items} configured={telegramReady} deploy={deploy} />
          ) : (
            <Alert tone="warning">Telegram digest tools require verified Known errors persistence.</Alert>
          )}
          {!telegramReady ? <Alert tone="info">Telegram alerts are not configured.</Alert> : null}
        </div>
      </Disclosure>
    </div>
  );
}
