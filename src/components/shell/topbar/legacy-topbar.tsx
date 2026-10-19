"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { MembershipChoice } from "@/modules/identity/context-service";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import type { AdminScope } from "@/modules/identity/context";
import type { AccountMenuVariant } from "../college-account-copy";
import type { ShellNavItem } from "../shell-model";
import { MobileNavigation } from "../mobile-navigation";
import { ShellWidgetBoundary } from "../shell-widget-boundary";
import { topbarConfigForPath } from "./portal-config";
import { TopbarCommandSearch } from "./command-search";
import { TopbarNotifications } from "./notification-actions";
import { TopbarAccountMenu } from "./account-menu";
import { PlusIcon } from "./icons";
import { TpoQuickCreate } from "./tpo-quick-create";
import style from "./topbar.module.css";

export function LegacyTopbar({
  navigation, roleLabel, organizationName, identityUid, accountVariant,
  memberships, activeMembershipId, adminScopeChoices, adminScope, tpoCollegeId,
}: {
  navigation: readonly ShellNavItem[];
  roleLabel: string;
  organizationName: string;
  identityUid: string;
  accountVariant: AccountMenuVariant;
  memberships: readonly MembershipChoice[];
  activeMembershipId: string | null;
  adminScopeChoices: AdminScopeChoices | null;
  adminScope: AdminScope | null | undefined;
  tpoCollegeId: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const config = topbarConfigForPath(pathname);
  return <header className={style.bar} aria-label="Application top bar">
    <div className="shrink-0 md:hidden">
      <ShellWidgetBoundary name="Mobile navigation" fallbackHref="/dashboard">
        <MobileNavigation items={navigation}/>
      </ShellWidgetBoundary>
    </div>
    <div className={style.command + " " + (!config.newHref ? style.commandNoNew : "")}>
      {config.portal === "tpo" && tpoCollegeId
        ? <Suspense fallback={<Link href="/tpo/placements/new" className={style.new} aria-label="New placement work">
            <PlusIcon/><span className={style.newLabel}>New</span>
          </Link>}>
            <TpoQuickCreate collegeId={tpoCollegeId}/>
          </Suspense>
        : config.newHref ? <Link href={config.newHref} title="Create new"
            className={style.new} aria-label="New">
            <PlusIcon/> <span className={style.newLabel}>New</span>
          </Link> : null}
      <TopbarCommandSearch key={pathname} items={navigation}/>
    </div>
    <ShellWidgetBoundary name="Header notifications" fallbackHref={config.notificationsHref}>
      <TopbarNotifications key={config.portal} config={config}/>
    </ShellWidgetBoundary>
    <div className={style.accountArea}>
      <p className={style.orgName} title={organizationName}>{organizationName}</p>
      <ShellWidgetBoundary name="Account actions" fallbackHref="/account/security">
        <TopbarAccountMenu identityUid={identityUid} roleLabel={roleLabel}
          organizationName={organizationName} variant={accountVariant}
          memberships={memberships} activeMembershipId={activeMembershipId}
          adminScopeChoices={adminScopeChoices} scope={adminScope}/>
      </ShellWidgetBoundary>
    </div>
  </header>;
}
