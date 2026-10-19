"use client";

import {useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import type {AdminScope} from "@/modules/identity/context";
import type {AdminScopeChoices} from "@/modules/admin-scope/service";
import type {MembershipChoice} from "@/modules/identity/context-service";
import {AdminScopeSwitcher} from "../admin-scope-switcher";
import {MembershipSwitcher} from "../membership-switcher";
import {ChevronIcon} from "./icons";
import style from "./topbar.module.css";

/** Legacy header org trigger: tenant selection never bypasses server permissions. */
export function TopbarOrganizationSwitcher({
  organizationName, memberships, activeMembershipId, choices, scope,
}: {
  organizationName: string;
  memberships: readonly MembershipChoice[];
  activeMembershipId: string|null;
  choices: AdminScopeChoices|null;
  scope: AdminScope|null|undefined;
}) {
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const canSwitch=Boolean(choices)||memberships.filter(item=>item.status==="ACTIVE").length>1;
  useEffect(()=>{
    if(!open)return;
    root.current?.querySelector<HTMLElement>("input, select")?.focus();
    const onPointer=(event:PointerEvent)=>{
      if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
    };
    const onKey=(event:KeyboardEvent)=>{
      if(event.key!=="Escape"||!root.current?.contains(event.target as Node))return;
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
  if(!canSwitch)return <p className={style.orgName} title={organizationName}>{organizationName}</p>;
  return <div ref={root} className={style.orgSwitcher}
    onBlur={event=>{
      const next=event.relatedTarget;
      if(open && next instanceof Node && !event.currentTarget.contains(next))setOpen(false);
    }}>
    <button ref={trigger} type="button" className={style.orgTrigger}
      title={organizationName} aria-label={"Switch workspace, current "+organizationName}
      aria-haspopup="dialog" aria-expanded={open} aria-keyshortcuts="ArrowDown"
      aria-controls={open?"lms-topbar-org-switcher":undefined}
      onClick={()=>setOpen(value=>!value)}
      onKeyDown={event=>{if(event.key==="ArrowDown"){event.preventDefault();setOpen(true);}}}>
      <span className={style.orgName}>{organizationName}</span>
      <ChevronIcon/>
    </button>
    {open?<div id="lms-topbar-org-switcher" role="dialog" aria-label={"Switch workspace from "+organizationName}
      aria-modal={false} className={style.orgPopover}>
      <p className={style.accountSectionHeading}>Switch workspace</p>
      {choices?<AdminScopeSwitcher choices={choices} scope={scope}/>:
        <MembershipSwitcher memberships={memberships} activeMembershipId={activeMembershipId}/>}
    </div>:null}
  </div>;
}
