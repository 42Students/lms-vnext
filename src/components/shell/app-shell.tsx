import type { ReactNode } from "react";
import {
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import type { MembershipChoice } from "@/modules/identity/context-service";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import { MembershipSwitcher } from "./membership-switcher";
import { AdminScopeSwitcher } from "./admin-scope-switcher";
import { AccountActions } from "./account-actions";
import { SidebarNav } from "./sidebar-nav";
import { MobileNavigation } from "./mobile-navigation";
import { LearnerTopbarTools } from "./learner-topbar-tools";
import { ToastProvider } from "@/components/ui/toast";
import { getLearnerShellAccess } from "@/modules/module-access/learner-shell-access";
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
  const learnerAccess = learner
    ? await getLearnerShellAccess(context)
    : null;
  const navigation = getShellNavigation(
    context,
    learnerAccess,
  );
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
      <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[var(--lms-sidebar-border)] bg-surface md:flex">
        <div className="flex min-h-20 items-center border-b border-[var(--lms-sidebar-border)] px-5">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-primary-text">
              42Students
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              LMS
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 pr-3">
          <SidebarNav items={navigation} />
        </div>
        <div className="border-t border-[var(--lms-sidebar-border)] px-5 py-4">
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

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <MobileNavigation items={navigation} />
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
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {learner ? <LearnerTopbarTools /> : null}
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
                  Employer access
                </p>
              ) : (
                <MembershipSwitcher
                  memberships={memberships}
                  activeMembershipId={context.membership?.id ?? null}
                />
              )}
              <AccountActions showNotifications={!learner} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
