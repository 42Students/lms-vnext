"use client";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import "@/components/shell/legacy-mobile-footer.css";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Source: lms2-fe/prod-2026 MobileFooter.jsx:175-191 and mobileFooter.scss:1-41.
 * Keep the present vNext destinations; copy the five distinct icons/labels. */
const links = [
  {label:"Home",href:"/tpo/home",icon:"/assets/images/common/analytics.svg"},
  {label:"Engage",href:"/tpo/recruiters",icon:"/assets/images/common/contact.svg"},
  {label:"Drives",href:"/tpo/placements",icon:"/assets/images/common/assignment.svg"},
  {label:"Students",href:"/tpo/students",icon:"/assets/images/common/myAccount.svg"},
  {label:"More",href:"/tpo/more",icon:"/assets/images/common/Menu-Icon.svg"},
] as const;

const moreLinks = [
  ["More","/tpo/more"],["Requests","/tpo/requests"],["Verification","/tpo/verification"],["Calendar","/tpo/calendar"],
  ["Team","/tpo/team"],["Reports","/tpo/reports"],["Messages","/tpo/messages"],
  ["Announcements","/tpo/announcements"],["Notifications","/tpo/notifications"],
  ["Settings","/tpo/settings"],["Audit log","/tpo/audit"],
] as const;

export function TpoMobileFooter() {
  const pathname = usePathname();
  const [moreOpen,setMoreOpen] = useState(false);
  // A mobile More sheet must not remain over a different route after
  // Back/Forward or programmatic navigation; the links also close on click.
  useEffect(()=>{setMoreOpen(false);},[pathname]);
  useEffect(()=>{
    const media=typeof window.matchMedia==="function"?window.matchMedia("(min-width: 768px)"):null;
    const closeOnTablet=()=>{if(media?.matches??window.innerWidth>=768)setMoreOpen(false);};
    closeOnTablet();
    media?.addEventListener("change",closeOnTablet);
    window.addEventListener("resize",closeOnTablet);
    return ()=>{media?.removeEventListener("change",closeOnTablet);window.removeEventListener("resize",closeOnTablet);};
  },[]);
  const moreActive = pathname==="/tpo/more"||pathname.startsWith("/tpo/more/")||
    moreLinks.some(([,href])=>pathname===href||pathname.startsWith(href+"/"));
  return <>
    <nav aria-label="TPO mobile footer" className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 grid min-w-0 grid-cols-5 md:hidden">
      {links.map(link=>{
        const active=pathname===link.href||pathname.startsWith(link.href+"/")||
          (link.label==="Engage"&&pathname.startsWith("/tpo/companies"));
        if(link.label==="More")return <Button key="more" variant="ghost" type="button"
          aria-label="More TPO workspaces" aria-expanded={moreOpen} aria-pressed={moreOpen}
          aria-current={moreActive?"page":undefined} onClick={()=>setMoreOpen(open=>!open)}
          className={"lms-tpo-mobile-footer-item flex h-full min-h-16 min-w-0 w-full flex-col items-center justify-center rounded-none border-0 bg-transparent px-1 py-1 text-center shadow-none hover:bg-transparent active:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] "+(moreOpen||moreActive?"active":"")}>
          <Image src={link.icon} alt="" width={24} height={24} className="lms-tpo-mobile-footer-icon"/>
          <span className="lms-tpo-mobile-footer-label">{link.label}</span>
        </Button>;
        return <Link key={link.label} href={link.href} title={link.label}
          onClick={() => setMoreOpen(false)}
          aria-current={active?"page":undefined}
          className={"lms-tpo-mobile-footer-item flex h-full min-h-16 min-w-0 flex-col items-center justify-center px-1 py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] "+(active?"active":"")}>
          <Image src={link.icon} alt="" width={24} height={24} className="lms-tpo-mobile-footer-icon"/>
          <span className="lms-tpo-mobile-footer-label">{link.label}</span>
        </Link>;
      })}
    </nav>
    <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="More TPO workspaces">
      <nav aria-label="More TPO destinations" className="grid min-w-0 grid-cols-1 divide-y divide-border">
        {moreLinks.map(([label,href])=><Link key={href} href={href}
          onClick={()=>setMoreOpen(false)}
          aria-current={pathname===href||pathname.startsWith(href+"/")?"page":undefined}
          className={"flex min-h-11 min-w-0 items-center break-words border-l-[3px] border-l-transparent px-3 py-3 text-sm font-semibold leading-5 text-body hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary "+(pathname===href||pathname.startsWith(href+"/")?"border-l-primary bg-primary-subtle text-link":"")}>{label}</Link>)}
      </nav>
    </BottomSheet>
  </>;
}
