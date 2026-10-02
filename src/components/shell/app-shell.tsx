import type { ReactNode } from "react";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { MembershipSwitcher } from "./membership-switcher";
import { AccountActions } from "./account-actions";
import { SidebarNav } from "./sidebar-nav";
import {
  getShellNavigation,
  getShellRoleLabel,
} from "./shell-model";

export function AppShell({
  context,
  memberships,
  children,
}: {
  context: RequestContext;
  memberships: readonly MembershipChoice[];
  children: ReactNode;
}) {
  const navigation = getShellNavigation(context);
  const currentMembership = context.membership
    ? memberships.find(
        (membership) => membership.id === context.membership?.id,
      ) ?? null
    : null;

  return (
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
          {currentMembership ? (
            <p className="mt-1 truncate text-sm font-semibold text-body">
              {currentMembership.collegeName}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="m-0 text-xs font-semibold text-muted-foreground">
                {getShellRoleLabel(context)}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">
                {currentMembership
                  ? currentMembership.collegeName
                  : context.user.systemRoles.includes("SUPER_ADMIN")
                    ? "Platform administration"
                    : "Choose an active college"}
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <MembershipSwitcher
                memberships={memberships}
                activeMembershipId={context.membership?.id ?? null}
              />
              <AccountActions />
            </div>
          </div>
          <div className="overflow-x-auto border-t border-[var(--lms-sidebar-border)] px-3 py-2 md:hidden">
            <div className="min-w-max">
              <SidebarNav items={navigation} compact />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
