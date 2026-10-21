"use client";

import {useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {PopoverPanel} from "@/components/ui/popover";
import type {AdminScope} from "@/modules/identity/context";
import type {AdminScopeChoices} from "@/modules/admin-scope/service";
import type {MembershipChoice} from "@/modules/identity/context-service";
import {AdminScopeSwitcher} from "../admin-scope-switcher";
import {MembershipSwitcher, workspaceChoices} from "../membership-switcher";
import {ChevronIcon} from "./icons";
import style from "./topbar.module.css";

/** Legacy header org trigger: tenant selection never bypasses server permissions. */
export function TopbarOrganizationSwitcher({
  organizationName, memberships, activeMembershipId, activeRole, choices, scope,
}: {
  organizationName: string;
  memberships: readonly MembershipChoice[];
  activeMembershipId: string|null;
  activeRole?: string | null;
  choices: AdminScopeChoices|null;
  scope: AdminScope|null|undefined;
}) {
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  // One active college may still have several independent role workspaces.
  const canSwitch=Boolean(choices)||workspaceChoices(memberships).length>1;
  const selectedCollege=scope?.collegeId
   ? choices?.colleges.find(row=>row.id===scope.collegeId):null;
  const selectedOrganization=scope?.organizationId
   ? choices?.organizations.find(row=>row.id===scope.organizationId):null;
  const currentName=selectedCollege
    ? selectedCollege.organizationName+" · "+selectedCollege.name
    : selectedOrganization?.name??organizationName;
  useEffect(()=>{
    if(!open)return;
    const first = Array.from(root.current?.querySelectorAll<HTMLElement>(
      '[data-slot="popover"] summary, [data-slot="popover"] input:not(:disabled), [data-slot="popover"] select:not(:disabled), [data-slot="popover"] button:not(:disabled)'
    ) ?? []).find(element => element.getClientRects().length > 0);
    (first ?? root.current?.querySelector<HTMLElement>('[data-slot="popover"]'))?.focus();
    const onPointer=(event:PointerEvent)=>{
      if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
    };
    const onKey=(event:KeyboardEvent)=>{
      if(event.defaultPrevented||event.key!=="Escape"||
         !(event.target instanceof Node)||!root.current?.contains(event.target))return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown",onPointer);
    document.addEventListener("keydown",onKey);
    return ()=>{
      document.removeEventListener("pointerdown",onPointer);
      document.removeEventListener("keydown",onKey);
    };
  },[open]);
  if(!canSwitch)return <p className={style.orgName+" min-w-0"} title={currentName}>{currentName}</p>;
  return <div ref={root} className={style.orgSwitcher+" min-w-0"}
    onBlur={event=>{
      const next=event.relatedTarget;
      if(open && next instanceof Node && !event.currentTarget.contains(next))setOpen(false);
    }}>
    <Button variant="secondary" size="sm" ref={trigger} type="button" className={style.orgTrigger+" min-w-0"}
      title={currentName} aria-label={"Switch workspace, current "+currentName}
      aria-haspopup="dialog" aria-expanded={open} aria-keyshortcuts="ArrowDown"
      aria-controls={open?"lms-topbar-org-switcher":undefined}
      onClick={()=>setOpen(value=>!value)}
      onKeyDown={event=>{if(event.key==="ArrowDown"){event.preventDefault();setOpen(true);}}}>
      <span className={style.orgName+" min-w-0"}>{currentName}</span>
      <ChevronIcon/>
    </Button>
    {choices?<span role="status" aria-label="Tenant scope is permission-controlled"
      title="Tenant scope is enforced by your permissions. The legacy manual lock control is unavailable."
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[var(--lms-neutral-400)]">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="5" y="10" width="14" height="11" rx="2"/>
        <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
      </svg>
    </span>:null}
    {open?<PopoverPanel id="lms-topbar-org-switcher" label={"Switch workspace from "+currentName} aria-describedby="lms-org-switcher-context" tabIndex={-1} className={style.orgPopover+" !min-h-0 min-w-0"}
      onDismiss={() => { setOpen(false); trigger.current?.focus(); }}>
      <span id="lms-org-switcher-context" className="sr-only">Current workspace: {currentName}</span>
      <p className={style.accountSectionHeading}>Switch workspace</p>
      {choices?<AdminScopeSwitcher choices={choices} scope={scope}/>:
        <MembershipSwitcher memberships={memberships} activeMembershipId={activeMembershipId} activeRole={activeRole}/>}
    </PopoverPanel>:null}
  </div>;
}
