"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminScope } from "@/modules/identity/context";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { apiFetch } from "@/lib/api-fetch";
import { AdminScopeSwitcher } from "../admin-scope-switcher";
import { MembershipSwitcher } from "../membership-switcher";
import { accountActionCopy, type AccountMenuVariant } from "../college-account-copy";
import { topbarInitials } from "./portal-config";
import { ChevronIcon } from "./icons";
import style from "./topbar.module.css";

export function TopbarAccountMenu({
  identityUid, roleLabel, organizationName, variant,
  memberships, activeMembershipId, adminScopeChoices, scope,
}: {
  identityUid: string;
  roleLabel: string;
  organizationName: string;
  variant: AccountMenuVariant;
  memberships: readonly MembershipChoice[];
  activeMembershipId: string | null;
  adminScopeChoices: AdminScopeChoices | null;
  scope: AdminScope | null | undefined;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const copy = accountActionCopy(variant);
  useEffect(() => {
    if (!open) return;
    // The legacy dropdown is an operable menu, not merely an avatar hover card.
    root.current?.querySelector<HTMLElement>('[role="dialog"] a, [role="dialog"] button, [role="dialog"] input, [role="dialog"] select')?.focus();
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "lms:signout" && event.newValue) {
        router.replace("/");
        router.refresh();
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [router]);

  function logout() {
    setError("");
    startTransition(async () => {
      try {
        await apiFetch("/api/auth/session", { method: "DELETE" });
        try { window.localStorage.setItem("lms:signout", String(Date.now())); }
        catch { /* Session deletion succeeded; storage may be disabled. */ }
        router.replace("/");
        router.refresh();
      } catch {
        setError("Could not sign out right now. Please try again.");
      }
    });
  }

  return <div className="relative shrink-0" ref={root}>
    <button type="button" ref={trigger} className={style.avatar}
      aria-label="Open account menu" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? "lms-topbar-account-dialog" : undefined}
      onClick={() => setOpen(value => !value)}
      title={roleLabel + " · " + organizationName}>
      <span className={style.avatarInner}>{topbarInitials(identityUid, roleLabel)}</span>
    </button>
    {open ? <div id="lms-topbar-account-dialog" role="dialog" aria-modal={false} aria-label="Account menu" className={style.menu}>
      <div className="px-2 pb-2 text-left">
        <p className={style.accountHeading}>{roleLabel}</p>
        <p className={style.accountSubheading}>{organizationName}</p>
      </div>
      {copy.accountHref ? <Link href={copy.accountHref}
        onClick={() => setOpen(false)} className={style.menuItem}>{copy.accountLabel}</Link> : null}
      {adminScopeChoices || memberships.length > 1 ? <>
        <hr className={style.menuDivider}/>
        <p className={style.accountSectionHeading}>Switch workspace</p>
        {adminScopeChoices ? <AdminScopeSwitcher choices={adminScopeChoices} scope={scope} /> :
          <MembershipSwitcher memberships={memberships} activeMembershipId={activeMembershipId}/>}
      </> : null}
      <hr className={style.menuDivider}/>
      <button type="button" disabled={pending} aria-busy={pending}
        className={style.menuItem} onClick={logout}>{pending ? "Signing out…" : copy.signOutLabel}
        <span className="ml-auto text-muted-foreground"><ChevronIcon /></span>
      </button>
      {error ? <p role="alert" className="px-2 pt-2 text-xs text-error">{error}</p> : null}
    </div> : null}
  </div>;
}
