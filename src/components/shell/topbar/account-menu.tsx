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
      aria-label="Open account menu" aria-haspopup="dialog" aria-expanded={open}
      onClick={() => setOpen(value => !value)}
      title={roleLabel + " · " + organizationName}>
      {topbarInitials(identityUid)}
    </button>
    {open ? <div role="dialog" aria-label="Account menu" className={style.menu}>
      <div className="px-2 pb-2 text-left">
        <p className="m-0 truncate text-[13px] font-semibold text-[#172033]">{roleLabel}</p>
        <p className="mt-1 truncate text-[12px] text-[#64748b]">{organizationName}</p>
      </div>
      <Link href={copy.accountHref ?? "/account/security"}
        onClick={() => setOpen(false)} className={style.menuItem}>{copy.accountLabel ?? "My Account"}</Link>
      {adminScopeChoices || memberships.length > 1 ? <>
        <hr className={style.menuDivider}/>
        <p className="px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Switch workspace</p>
        {adminScopeChoices ? <AdminScopeSwitcher choices={adminScopeChoices} scope={scope} /> :
          <MembershipSwitcher memberships={memberships} activeMembershipId={activeMembershipId}/>}
      </> : null}
      <hr className={style.menuDivider}/>
      <button type="button" disabled={pending}
        className={style.menuItem} onClick={logout}>{pending ? "Signing out…" : copy.signOutLabel}
        <span className="ml-auto text-[#94a3b8]"><ChevronIcon /></span>
      </button>
      {error ? <p role="alert" className="px-2 pt-2 text-xs text-[#b91c1c]">{error}</p> : null}
    </div> : null}
  </div>;
}
