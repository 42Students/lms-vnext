"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {PopoverPanel} from "@/components/ui/popover";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminScope } from "@/modules/identity/context";
import type { AdminScopeChoices } from "@/modules/admin-scope/service";
import type { MembershipChoice } from "@/modules/identity/context-service";
import { apiFetch } from "@/lib/api-fetch";
import { AdminScopeSwitcher } from "../admin-scope-switcher";
import { MembershipSwitcher, workspaceChoices } from "../membership-switcher";
import { accountActionCopy, type AccountMenuVariant } from "../college-account-copy";
import { topbarInitials } from "./portal-config";
import { ChevronIcon } from "./icons";
import style from "./topbar.module.css";

const avatarTriggerClass = `${style.avatar} max-[767px]:!min-h-11 max-[767px]:!min-w-11`;
const accountMenuClass = `${style.menu} !min-h-0`;

export function TopbarAccountMenu({
  identityUid, roleLabel, organizationName, variant,
  memberships, activeMembershipId, activeRole, adminScopeChoices, scope,
}: {
  identityUid: string;
  roleLabel: string;
  organizationName: string;
  variant: AccountMenuVariant;
  memberships: readonly MembershipChoice[];
  activeMembershipId: string | null;
  activeRole?: string | null;
  adminScopeChoices: AdminScopeChoices | null;
  scope: AdminScope | null | undefined;
}) {
  const router = useRouter();
  const pathname=usePathname()??"/";
  const mentorPortal=pathname==="/mentor"||pathname.startsWith("/mentor/");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const copy = accountActionCopy(variant);
  useEffect(() => {
    if (!open) return;
    // The legacy dropdown is an operable menu, not merely an avatar hover card.
    const first = Array.from(root.current?.querySelectorAll<HTMLElement>(
      '[data-slot="popover"] a[href]:not([aria-disabled="true"]), [data-slot="popover"] summary, [data-slot="popover"] button:not(:disabled), [data-slot="popover"] input:not(:disabled), [data-slot="popover"] select:not(:disabled)'
    ) ?? []).find(element => element.getClientRects().length > 0);
    (first ?? root.current?.querySelector<HTMLElement>('[data-slot="popover"]'))?.focus();
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      // Other menus may be open elsewhere in the shell; this listener owns
      // only the account panel and never overrides an inner listbox's key.
      if (event.defaultPrevented || !(event.target instanceof HTMLElement) ||
          !root.current?.contains(event.target)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) ||
          event.target.closest('input, select, textarea, [contenteditable="true"], [role="listbox"]')) return;
      const actions = Array.from(root.current.querySelectorAll<HTMLElement>(
        '[data-slot="popover"] a[href]:not([aria-disabled="true"]), [data-slot="popover"] button:not(:disabled):not([aria-disabled="true"])'
      )).filter(action => action.getClientRects().length > 0 &&
        !action.closest('[hidden], [inert], [aria-disabled="true"]'));
      if (!actions.length) return;
      const index = actions.indexOf(event.target);
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? actions.length - 1
        : event.key === "ArrowDown" ? (index + 1) % actions.length
        : index < 0 ? actions.length - 1 : (index - 1 + actions.length) % actions.length;
      actions[next]?.focus();
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

  return <div className="relative min-w-0 shrink-0" ref={root}
    onBlur={event => {
      const next = event.relatedTarget;
      if (open && next instanceof Node && !event.currentTarget.contains(next)) setOpen(false);
    }}>
    <Button variant="ghost" size="icon-sm" type="button" ref={trigger} className={avatarTriggerClass}
      aria-label={open?"Close account menu":"Open account menu"} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? "lms-topbar-account-dialog" : undefined}
      onClick={() => setOpen(value => !value)}
      title={roleLabel + " · " + organizationName}>
      <span className={style.avatarInner}>{topbarInitials(identityUid, roleLabel)}</span>
    </Button>
    {open ? <PopoverPanel id="lms-topbar-account-dialog" label="Account menu" className={accountMenuClass}
      tabIndex={-1} onDismiss={() => { setOpen(false); trigger.current?.focus(); }}>
      <div className="min-w-0 px-2 pb-[var(--lms-space-2)] text-left">
        <p className={style.accountHeading}>{roleLabel}</p>
        <p className={style.accountSubheading}>{organizationName}</p>
      </div>
      {mentorPortal?<Link href="/mentor/account"
        onClick={()=>setOpen(false)} className={style.menuItem}>
        Mentor profile details
      </Link>:null}
      {copy.accountHref ? <Link href={copy.accountHref}
        onClick={() => setOpen(false)} className={style.menuItem}>{copy.accountLabel}</Link> : null}
      {adminScopeChoices || workspaceChoices(memberships).length > 1 ? <>
        <hr className={style.menuDivider}/>
        <p className={style.accountSectionHeading}>Switch workspace</p>
        {adminScopeChoices ? <AdminScopeSwitcher choices={adminScopeChoices} scope={scope} /> :
          <MembershipSwitcher memberships={memberships} activeMembershipId={activeMembershipId} activeRole={activeRole}/>}
      </> : null}
      <hr className={style.menuDivider}/>
      <Button variant="ghost" type="button" disabled={pending} loading={pending} aria-busy={pending}
        className={style.menuItem} onClick={logout}>{pending ? "Signing out…" : copy.signOutLabel}
        <span className="ml-auto text-muted-foreground"><ChevronIcon /></span>
      </Button>
      {error ? <p role="alert" className="min-w-0 break-words px-2 pt-[var(--lms-space-2)] text-xs text-error leading-[20px]">{error}</p> : null}
    </PopoverPanel> : null}
  </div>;
}
