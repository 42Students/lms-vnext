import { Suspense, type ReactNode } from "react";
import {
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import type { MembershipChoice } from "@/modules/identity/context-service";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import { accountMenuVariant } from "./college-account-copy";
import { PageTitle } from "./page-title";
import { SidebarNav } from "./sidebar-nav";
import Link from "next/link";
import {ShellLogoMark, ShellLogoWordmark} from "./shell-nav-icons";
import { LegacyTopbar } from "./topbar/legacy-topbar";
import { RouteAnnouncer } from "./route-announcer";
import {ShellWidgetBoundary} from "./shell-widget-boundary";
import {ShellConnectivityNotice} from "./shell-connectivity-notice";
import {canOpenTpoWorkspace} from "@/modules/placements/tpo-workspace-access-model";
import { ToastProvider } from "@/components/ui/toast";
import { TrackerQuickReportLauncher } from "@/components/tracker/tracker-quick-report-launcher";
import { getLearnerShellAccess } from "@/modules/module-access/learner-shell-access";
import {getTpoShellVerificationAccess} from "@/modules/verification/tpo-shell-access-service";
import {
  getShellNavigation,
  getShellRoleLabel,
} from "./shell-model";

export async function AppShell({
  context,
  memberships,
  adminScopeChoices,
  children,
}: {
  context: RequestContext;
  memberships: readonly MembershipChoice[];
  adminScopeChoices: AdminScopeChoices | null;
  children: ReactNode;
}) {
  const superAdmin = isSuperAdmin(context);
  const learner = hasMembershipRole(context, "LEARNER");
  const accountVariant = accountMenuVariant({
    superAdmin,
    roles: context.membership?.roles ?? [],
    recruiterOnly: !context.membership && Boolean(context.recruiter),
  });
  const learnerAccess = learner
    ? await getLearnerShellAccess(context)
    : null;
  const tpoVerificationEnabled=hasMembershipRole(context,"TPO")
    ?await getTpoShellVerificationAccess(context):false;
  const navigation=getShellNavigation(context,learnerAccess,tpoVerificationEnabled);
  const currentMembership = context.membership
    ? memberships.find(
        (membership) => membership.id === context.membership?.id,
      ) ?? null
    : null;

  const selectedScopeLabel = context.adminScope?.collegeId
    ? adminScopeChoices?.colleges.find(
        (college) => college.id === context.adminScope?.collegeId,
      )?.name ?? "Scoped college"
    : context.adminScope?.organizationId
      ? adminScopeChoices?.organizations.find(
          (organization) =>
            organization.id === context.adminScope?.organizationId,
        )?.name ?? "Scoped organization"
      : null;

  return (
    <ToastProvider>
      <PageTitle superAdmin={superAdmin} />
      <div className="min-h-dvh bg-background text-foreground">
        <a href="#lms-main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3 focus:text-link focus:outline-2 focus:outline-[var(--lms-primary)]">Skip to content</a>
      <aside data-slot="legacy-sidebar" className="lms-desktop-sidebar fixed inset-y-0 left-0 z-20 hidden flex-col md:flex">
        <div className="lms-sidebar-logo-row flex h-20 shrink-0 items-center justify-center border-b border-[var(--lms-sidebar-border)] px-2">
          <Link href="/dashboard" aria-label="42Students LMS home"
            className="lms-sidebar-brand-link inline-flex h-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            <span className="lms-sidebar-brand-mark"><ShellLogoMark /></span>
             <span className="lms-sidebar-brand-wordmark"><ShellLogoWordmark /></span>
          </Link>
        </div>
        <div className="lms-sidebar-scroll min-h-0 flex-1 overflow-y-auto pt-2 pb-4">
          <ShellWidgetBoundary name="Sidebar navigation" fallbackHref="/dashboard"><SidebarNav items={navigation} /></ShellWidgetBoundary>
        </div>
        <div className="lms-sidebar-role-details border-t border-[var(--lms-sidebar-border)] px-4 py-[25px]">
          <p className="m-0 text-xs font-semibold text-muted-foreground">
            {getShellRoleLabel(context)}
          </p>
          {currentMembership ||
          selectedScopeLabel ||
          context.recruiter ? (
            <p className="mt-1 truncate text-sm font-semibold text-body">
              {currentMembership?.collegeName ??
                selectedScopeLabel ??
                context.recruiter?.companyName}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="lms-shell-page min-h-dvh">
        <LegacyTopbar
          navigation={navigation}
          roleLabel={getShellRoleLabel(context)}
          organizationName={selectedScopeLabel ??
            currentMembership?.collegeName ?? context.recruiter?.companyName ??
            "Platform administration"}
          identityUid={context.user.identityUid}
          accountVariant={accountVariant}
          memberships={memberships}
          activeMembershipId={context.membership?.id ?? null}
          adminScopeChoices={superAdmin ? adminScopeChoices : null}
          adminScope={context.adminScope}
          tpoCollegeId={hasMembershipRole(context, "TPO") ? context.membership?.collegeId ?? null : null}
        />

        <Suspense fallback={null}><RouteAnnouncer /></Suspense>
        <ShellConnectivityNotice />
        <main id="lms-main-content" tabIndex={-1} style={{ paddingRight: "16px" }} className={"mx-auto min-w-0 w-full max-w-[1600px] px-4 py-6 sm:pl-6 sm:pr-4 lg:py-8 "+(canOpenTpoWorkspace(context)?"pb-24 md:pb-6":"")}>
          {children}
        </main>
      </div>
    </div>
      <TrackerQuickReportLauncher />
    </ToastProvider>
  );
}
