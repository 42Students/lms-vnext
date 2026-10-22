"use client";

import Link from "next/link";

type MessagesTab = "recruiters" | "team";
const TABS: readonly MessagesTab[] = ["recruiters", "team"];

/** Legacy Recruiters/Team card tabs, with a single tab stop and keyboard
 * arrow/Home/End navigation. Enter or Space follows the focused tab link.
 * The server page still enforces membership authorization for each panel.
 */
export function TpoMessagesTabs({selected}:{selected:MessagesTab}){
  return <nav role="tablist" aria-label="Messages"
    className="flex gap-2 border-b border-border pb-2"
    onKeyDown={event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      const target=event.target;
      if(!(target instanceof HTMLElement))return;
      const current=target.closest<HTMLAnchorElement>('a[role="tab"]');
      if(!current)return;
      const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[role="tab"]'));
      const index=tabs.indexOf(current);
      if(index<0||tabs.length===0)return;
      event.preventDefault();
      const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:
        (index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
      tabs[next]?.focus();
    }}>
    {TABS.map(value=><Link key={value} role="tab"
      id={"tpo-messages-tab-"+value}
      aria-controls={"tpo-messages-panel-"+value}
      aria-selected={selected===value}
      tabIndex={selected===value?0:-1}
      href={"/tpo/messages?tab="+value}
      className={"inline-flex min-h-11 items-center border-b-[3px] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 "+
        (selected===value?"border-primary text-link":"border-transparent text-body hover:text-link")}>
      {value==="recruiters"?"Recruiters":"Team"}
    </Link>)}
  </nav>;
}
