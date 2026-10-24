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
import {PrototypePortalFrame} from "./prototype-portal-frame";
import Link from "next/link";
import {ShellLogoMark, ShellLogoWordmark} from "./shell-nav-icons";
import { LegacyTopbar } from "./topbar/legacy-topbar";
import { RouteAnnouncer } from "./route-announcer";
import { RouteTransition } from "./route-transition";
import { RouteProgress } from "./route-progress";
import { LearnerFacultyMobileFooter } from "./learner-faculty-mobile-footer";
import {ShellWidgetBoundary} from "./shell-widget-boundary";
import {TPO_PROTOTYPE_NAV} from "./tpo-prototype-navigation";
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
  const resolvedNavigation=getShellNavigation(context,learnerAccess,tpoVerificationEnabled);
  // The prototype shell applies only to these single-workspace portals.
  // Mixed-role and College Admin navigation retain the existing shell.
  const prototypePortal =
    resolvedNavigation[0]?.href === "/tpo/home" ? "tpo" :
    resolvedNavigation[0]?.href === "/hr/home" ? "recruiter" :
    resolvedNavigation[0]?.href === "/mentor/projects" ? "mentor" : null;
  const navigation=prototypePortal==="tpo"?TPO_PROTOTYPE_NAV:resolvedNavigation;
  const homeHref=navigation[0]?.href??"/dashboard";
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
      <PrototypePortalFrame
        className="lms-shell-frame min-h-dvh bg-background text-foreground"
        mentorEnabled={hasMembershipRole(context,"MENTOR")}
        tpoEnabled={hasMembershipRole(context,"TPO")}
        recruiterEnabled={Boolean(context.recruiter)||prototypePortal==="recruiter"}>
        <a href="#lms-main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3 focus:text-link focus:outline-2 focus:outline-[var(--lms-primary)]">Skip to content</a>
      <aside data-slot="legacy-sidebar" className="lms-desktop-sidebar relative z-20 hidden h-screen shrink-0 flex-col md:flex">
        <div className="lms-sidebar-logo-row flex h-20 shrink-0 items-center justify-center border-b border-[var(--lms-sidebar-border)] px-2">
          <Link href={homeHref} aria-label="42Students LMS home"
            className="lms-sidebar-brand-link inline-flex h-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            <span className="lms-prototype-wordmark" aria-hidden="true">42LMS</span>
            <span className="lms-sidebar-brand-mark"><ShellLogoMark /></span>
             <span className="lms-sidebar-brand-wordmark"><ShellLogoWordmark /></span>
          </Link>
        </div>
        <div className="lms-sidebar-scroll min-h-0 flex-1 overflow-y-auto pt-2 pb-4">
          <ShellWidgetBoundary name="Sidebar navigation" fallbackHref={homeHref}><SidebarNav items={navigation} /></ShellWidgetBoundary>
        </div>
        {prototypePortal === "recruiter" ? (
          <Link href="/hr/drives/new" className="lms-prototype-recruiter-action">+ Request a drive</Link>
        ) : null}
        <div className="lms-sidebar-role-details min-w-0 border-t border-[var(--lms-sidebar-border)]">
          <p className="m-0 min-w-0 truncate text-xs font-semibold text-muted-foreground">
            {getShellRoleLabel(context)}
          </p>
          {currentMembership ||
          selectedScopeLabel ||
          context.recruiter ? (
            <p className="mt-1 min-w-0 truncate text-sm font-semibold text-body">
              {currentMembership?.collegeName ??
                selectedScopeLabel ??
                context.recruiter?.companyName}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="lms-shell-page min-h-dvh min-w-0 flex-1 overflow-x-clip">
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
          activeRole={context.membership?.roles[0] ?? null}
          adminScopeChoices={superAdmin ? adminScopeChoices : null}
          adminScope={context.adminScope}
          tpoCollegeId={hasMembershipRole(context, "TPO") ? context.membership?.collegeId ?? null : null}
        />

        <RouteProgress />
        <Suspense fallback={null}><RouteAnnouncer /></Suspense>
        <ShellConnectivityNotice />
        <main id="lms-main-content" tabIndex={-1} className={"lms-shell-page-main mx-auto min-w-0 w-full px-[var(--lms-space-3)] py-[var(--lms-space-4)] min-[768px]:px-[14px] min-[768px]:py-[var(--lms-space-6)] min-[992px]:px-[var(--lms-space-6)] "+(canOpenTpoWorkspace(context)?"pb-24 md:pb-6":"")}>
          <RouteTransition>{children}</RouteTransition>
        </main>
        <LearnerFacultyMobileFooter items={navigation} />
      </div>
    </PrototypePortalFrame>
      <TrackerQuickReportLauncher />
    </ToastProvider>
  );
}
