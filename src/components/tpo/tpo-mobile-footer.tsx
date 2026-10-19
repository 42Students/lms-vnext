"use client";
import {BottomSheet} from "@/components/ui/bottom-sheet";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useState} from "react";
import {usePathname} from "next/navigation";

/** Compact legacy TPO daily-work footer. The full sidebar remains available via More. */
const links=[
 {label:"Home",href:"/tpo/home"},
 {label:"Engage",href:"/tpo/recruiters"},
 {label:"Drives",href:"/tpo/placements"},
 {label:"Students",href:"/tpo/students"},
 {label:"More",href:"/tpo/settings"},
];
export function TpoMobileFooter(){
 const pathname=usePathname();
 const [moreOpen,setMoreOpen]=useState(false);
 const moreLinks=[
  ["Requests","/tpo/requests"],["Verification","/tpo/verification"],["Calendar","/tpo/calendar"],
  ["Team","/tpo/team"],["Reports","/tpo/reports"],["Messages","/tpo/messages"],
  ["Announcements","/tpo/announcements"],["Notifications","/tpo/notifications"],
  ["Settings","/tpo/settings"],["Audit log","/tpo/audit"],
 ];
 return <><nav aria-label="TPO mobile footer" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden">
  {links.map(link=>{
   const active=pathname===link.href||pathname.startsWith(link.href+"/")||
    (link.label==="Engage"&&pathname.startsWith("/tpo/companies"));
   if(link.label==="More")return <Button key="more" variant="ghost" type="button" aria-label="More TPO workspaces"
    aria-expanded={moreOpen} onClick={()=>setMoreOpen(open=>!open)}
    className={"min-h-14 px-1 py-2 text-xs font-semibold "+(moreOpen?"bg-primary-subtle text-primary-text":"text-body")}>More</Button>;
   return <Link key={link.label} href={link.href}
    aria-current={active?"page":undefined}
    className={"flex min-h-14 items-center justify-center px-1 py-2 text-center text-xs font-semibold "+(active?"bg-primary-subtle text-primary-text":"text-body")}>
    {link.label}
   </Link>;
  })}
 </nav>
 <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="More TPO workspaces">
   <nav aria-label="More TPO destinations" className="grid grid-cols-2 gap-2">
    {moreLinks.map(([label,href])=><Link key={href} href={href}
     onClick={()=>setMoreOpen(false)}
     className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-3 text-sm font-semibold text-primary-text">{label}</Link>)}
   </nav>
  </BottomSheet>
 </>;
}
