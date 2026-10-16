"use client";
import Link from "next/link";
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
 return <nav aria-label="TPO mobile footer" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden">
  {links.map(link=>{
   const active=pathname===link.href||pathname.startsWith(link.href+"/")||
    (link.label==="Engage"&&pathname.startsWith("/tpo/companies"));
   return <Link key={link.label} href={link.href}
    aria-current={active?"page":undefined}
    className={"flex min-h-14 items-center justify-center px-1 py-2 text-center text-xs font-semibold "+(active?"bg-primary-subtle text-primary-text":"text-body")}>
    {link.label}
   </Link>;
  })}
 </nav>;
}
