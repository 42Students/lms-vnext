"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
const destinations=[
 {label:"Home",href:"/tpo/home",icon:"⌂"},
 {label:"Engage",href:"/tpo/recruiters",icon:"✉"},
 {label:"Drives",href:"/tpo/placements",icon:"▣"},
 {label:"Students",href:"/tpo/students",icon:"◉"},
 {label:"More",href:"/tpo/team",icon:"☷"},
] as const;
/** Compact legacy TPO primary navigation; hamburger retains all other tools. */
export function TpoMobileFooter(){
 const pathname=usePathname();
 return <nav aria-label="Placement cell mobile navigation"
  className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden">
  {destinations.map(item=>{
   const active=pathname===item.href||pathname.startsWith(item.href+"/");
   return <Link key={item.href} href={item.href} aria-current={active?"page":undefined}
    className={"flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold "+
     (active?"text-primary-text":"text-body")}>
    <span aria-hidden="true" className="text-lg">{item.icon}</span><span>{item.label}</span>
   </Link>;
  })}
 </nav>;
}
