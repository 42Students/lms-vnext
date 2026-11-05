"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import { Img } from "@/components/ui/img";

const NAV=[
 {label:"Platform",href:"/platform"},
 {label:"For Universities",href:"/universities"},
 {label:"For Enterprises",href:"/enterprises"},
 {label:"Request a Demo",href:"/request-demo"},
] as const;
const navLink="inline-flex min-h-11 items-center rounded-md px-2 text-[14px] font-medium text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] focus-ring";
const demoLink="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--lms-primary)] px-5 text-sm font-semibold text-[color:var(--lms-on-primary)] hover:bg-[var(--lms-primary-hover)] focus-ring";

export function MarketingHeaderClient(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false);
 const [scrolled,setScrolled]=useState(false);
 const ref=useRef<HTMLElement>(null);
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setOpen(false);},[pathname]);
 useEffect(()=>{
  const check=()=>setScrolled(window.scrollY>8);
  check();window.addEventListener("scroll",check,{passive:true});
  return ()=>window.removeEventListener("scroll",check);
 },[]);
 useEffect(()=>{
  if(!open)return;
  const key=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){setOpen(false);button.current?.focus();}
  };
  const outside=(event:PointerEvent)=>{
   if(event.target instanceof Node&&!ref.current?.contains(event.target))setOpen(false);
  };
  document.addEventListener("keydown",key);
  document.addEventListener("pointerdown",outside);
  return ()=>{document.removeEventListener("keydown",key);document.removeEventListener("pointerdown",outside);};
 },[open]);
 const dismiss=()=>setOpen(false);
 return <header ref={ref} className={"sticky top-0 z-(--lms-z-shell) min-h-[68px] border-b backdrop-blur-lg transition-[background-color,box-shadow,border-color] motion-reduce:transition-none "+(scrolled?"border-[var(--lms-canvas-border)] bg-[color:color-mix(in_srgb,var(--lms-white)_95%,transparent)] shadow-(--lms-elevation-3)":"border-transparent bg-[color:color-mix(in_srgb,var(--lms-white)_90%,transparent)]")}>
  <nav aria-label="Primary" className="relative mx-auto flex min-h-[68px] max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5">
   <Link href="/" onClick={dismiss} className="inline-flex min-h-11 items-center focus-ring" aria-label="42 LMS home">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <Img src="/assets/images/legacy-42lms-logo.svg" width={151} height={37} alt="42 LMS" className="h-[36px] w-[152px] object-contain"/>
   </Link>
   <div className="hidden lg:flex items-center gap-5">
    {NAV.map(item=><Link key={item.href} href={item.href} className={navLink}>{item.label}</Link>)}
    <Link href="/login" className={navLink}>Login</Link>
    <Link href="/request-demo" className={demoLink}>Request a Demo <span aria-hidden="true" className="ml-2">↗</span></Link>
   </div>
   <Button ref={button} type="button" aria-label="Toggle menu" aria-expanded={open} aria-controls="marketing-mobile-menu"
    onClick={()=>setOpen(value=>!value)}
    className="w-11 lg:hidden">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
     {open?<path d="M5 5l14 14M19 5L5 19"/>:<path d="M4 6h16M4 12h16M4 18h16"/>}
    </svg>
   </Button>
   <div id="marketing-mobile-menu" hidden={!open} className="absolute inset-x-0 top-full z-(--lms-z-shell) border-b border-[var(--lms-canvas-border)] bg-surface px-5 pb-5 pt-2 shadow-xl lg:!hidden">
    <div className="flex flex-col items-stretch gap-1">
     {NAV.map(item=><Link onClick={dismiss} key={item.href} href={item.href} className={navLink}>{item.label}</Link>)}
     <Link href="/login" onClick={dismiss} className={navLink}>Login</Link>
     <Link href="/request-demo" onClick={dismiss} className={demoLink}>Request a Demo <span aria-hidden="true" className="ml-2">↗</span></Link>
    </div>
   </div>
  </nav>
 </header>;
}
