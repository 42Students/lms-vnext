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
  {label:"More",href:"/tpo/settings",icon:"/assets/images/common/Menu-Icon.svg"},
] as const;

const moreLinks = [
  ["Requests","/tpo/requests"],["Verification","/tpo/verification"],["Calendar","/tpo/calendar"],
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
  const moreActive = moreLinks.some(([,href])=>pathname===href||pathname.startsWith(href+"/"));
  return <>
    <nav aria-label="TPO mobile footer" className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 md:hidden">
      {links.map(link=>{
        const active=pathname===link.href||pathname.startsWith(link.href+"/")||
          (link.label==="Engage"&&pathname.startsWith("/tpo/companies"));
        if(link.label==="More")return <Button key="more" variant="ghost" type="button"
          aria-label="More TPO workspaces" aria-expanded={moreOpen} aria-pressed={moreOpen}
          aria-current={moreActive?"page":undefined} onClick={()=>setMoreOpen(open=>!open)}
          className={"lms-tpo-mobile-footer-item flex h-full min-h-16 w-full flex-col items-center justify-center rounded-none px-1 py-1 "+(moreOpen||moreActive?"active":"")}>
          <Image src={link.icon} alt="" width={24} height={24} className="lms-tpo-mobile-footer-icon"/>
          <span className="lms-tpo-mobile-footer-label">More</span>
        </Button>;
        return <Link key={link.label} href={link.href}
          aria-current={active?"page":undefined}
          className={"lms-tpo-mobile-footer-item flex min-h-16 flex-col items-center justify-center px-1 py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] "+(active?"active":"")}>
          <Image src={link.icon} alt="" width={24} height={24} className="lms-tpo-mobile-footer-icon"/>
          <span className="lms-tpo-mobile-footer-label">{link.label}</span>
        </Link>;
      })}
    </nav>
    <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="More TPO workspaces">
      <nav aria-label="More TPO destinations" className="grid grid-cols-2 gap-2">
        {moreLinks.map(([label,href])=><Link key={href} href={href}
          onClick={()=>setMoreOpen(false)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-3 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{label}</Link>)}
      </nav>
    </BottomSheet>
  </>;
}
