import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { RECRUITER_REQUEST_DRIVE_HREF } from "@/modules/placements/recruiter-page-copy";
import {
  hasMembershipRole,
  hasActiveRecruiter,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import type { MembershipChoice } from "@/modules/identity/context-service";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import { MembershipSwitcher } from "./membership-switcher";
import { AdminScopeSwitcher } from "./admin-scope-switcher";
import { AccountActions } from "./account-actions";
import { accountMenuVariant } from "./college-account-copy";
import { PageTitle } from "./page-title";
import { SidebarNav } from "./sidebar-nav";
import {ShellLogoMark} from "./shell-nav-icons";
import { MobileNavigation } from "./mobile-navigation";
import { RouteAnnouncer } from "./route-announcer";
import {ShellWidgetBoundary} from "./shell-widget-boundary";
import {ShellConnectivityNotice} from "./shell-connectivity-notice";
import {hasTpoTooling} from "@/modules/placements/tpo-workspace-access-model";
import {canOpenTpoWorkspace} from "@/modules/placements/tpo-workspace-access-model";
import { LearnerTopbarTools } from "./learner-topbar-tools";
import {TpoTopbarMessages} from "./tpo-topbar-messages";
import {HrRecruiterBell} from "@/components/hr/hr-recruiter-bell";
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
        <a href="#lms-main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3 focus:text-[var(--lms-link-text)] focus:outline-2 focus:outline-[var(--lms-teal-deep)]">Skip to content</a>
      <aside data-slot="legacy-sidebar" className="lms-desktop-sidebar fixed inset-y-0 left-0 z-20 hidden flex-col lg:flex">
        <div className="flex h-20 shrink-0 items-center justify-center border-b border-[#f1f4f9] px-2">
          <Link href="/dashboard" aria-label="42Students LMS home"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26bac7]">
            <ShellLogoMark />
          </Link>
        </div>
        <div className="lms-sidebar-scroll min-h-0 flex-1 overflow-y-auto py-2">
          <ShellWidgetBoundary name="Sidebar navigation" fallbackHref="/dashboard"><SidebarNav items={navigation} /></ShellWidgetBoundary>
        </div>
        <div className="lms-sidebar-role-details border-t border-[var(--lms-sidebar-border)] px-5 py-4">
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
        <header className="sticky top-0 pt-[env(safe-area-inset-top)] z-10 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <ShellWidgetBoundary name="Mobile navigation" fallbackHref="/dashboard"><MobileNavigation items={navigation} /></ShellWidgetBoundary>
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-muted-foreground">
                  {getShellRoleLabel(context)}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {currentMembership
                    ? currentMembership.collegeName
                    : superAdmin
                      ? selectedScopeLabel ?? "Platform administration"
                      : context.recruiter
                        ? context.recruiter.companyName
                        : "Choose an active college"}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
              {learner ? <ShellWidgetBoundary name="Learner tools" fallbackHref="/learn/notifications"><LearnerTopbarTools /></ShellWidgetBoundary> : null}
              {hasTpoTooling(context)?<ShellWidgetBoundary name="TPO unread messages" fallbackHref="/tpo/messages"><TpoTopbarMessages/></ShellWidgetBoundary>:null}
              {superAdmin && adminScopeChoices ? (
                <AdminScopeSwitcher
                  choices={adminScopeChoices}
                  scope={context.adminScope}
                />
              ) : memberships.length > 0 ? (
                <MembershipSwitcher
                  memberships={memberships}
                  activeMembershipId={context.membership?.id ?? null}
                />
              ) : context.recruiter ? (
                <p className="m-0 hidden text-xs font-semibold text-muted-foreground sm:block">
                  Recruiter
                </p>
              ) : (
                <MembershipSwitcher
                  memberships={memberships}
                  activeMembershipId={context.membership?.id ?? null}
                />
              )}
              {!context.membership && context.recruiter ? (
                <Link href={RECRUITER_REQUEST_DRIVE_HREF}
                  className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 text-sm font-semibold text-on-primary">
                  Request a drive
                </Link>
              ) : null}
              {hasActiveRecruiter(context)?<HrRecruiterBell/>:null}
              <ShellWidgetBoundary name="Account actions" fallbackHref="/dashboard"><AccountActions showNotifications={!learner&&!hasActiveRecruiter(context)&&!hasTpoTooling(context)} variant={accountVariant} /></ShellWidgetBoundary>
            </div>
          </div>
        </header>

        <Suspense fallback={null}><RouteAnnouncer /></Suspense>
        <ShellConnectivityNotice />
        <main id="lms-main-content" tabIndex={-1} className={"mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 "+(canOpenTpoWorkspace(context)?"pb-24 md:pb-6":"")}>
          {children}
        </main>
      </div>
    </div>
      <TrackerQuickReportLauncher />
    </ToastProvider>
  );
}
