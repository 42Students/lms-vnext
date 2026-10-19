"use client";

import Link from "next/link";
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
import style from "./topbar.module.css";

export function LegacyTopbar({
  navigation, roleLabel, organizationName, identityUid, accountVariant,
  memberships, activeMembershipId, adminScopeChoices, adminScope,
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
}) {
  const pathname = usePathname() ?? "/";
  const config = topbarConfigForPath(pathname);
  return <header className={style.bar} aria-label="Application top bar">
    <div className="shrink-0 lg:hidden">
      <ShellWidgetBoundary name="Mobile navigation" fallbackHref="/dashboard">
        <MobileNavigation items={navigation}/>
      </ShellWidgetBoundary>
    </div>
    <div className={style.command}>
      <TopbarCommandSearch items={navigation}/>
      {config.newHref ? <Link href={config.newHref} title="Create new"
        className={style.new} aria-label="New">
        <PlusIcon/> <span className={style.newLabel}>New</span>
      </Link> : null}
    </div>
    <ShellWidgetBoundary name="Header notifications" fallbackHref={config.notificationsHref}>
      <TopbarNotifications config={config}/>
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
