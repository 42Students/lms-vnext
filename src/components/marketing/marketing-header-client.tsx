"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";

const NAV=[
 {label:"Platform",href:"/platform"},
 {label:"For Universities",href:"/universities"},
 {label:"For Enterprises",href:"/enterprises"},
 {label:"Request a Demo",href:"/request-demo"},
] as const;
const navLink="inline-flex min-h-11 items-center rounded-md px-2 text-[14px] font-medium text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]";
const demoLink="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--lms-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]";

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
 return <header ref={ref} className={"sticky top-0 z-40 min-h-[68px] border-b backdrop-blur-lg transition-[background-color,box-shadow,border-color] motion-reduce:transition-none "+(scrolled?"border-[var(--lms-canvas-border)] bg-white/95 shadow-[0_4px_24px_rgba(15,46,58,0.10)]":"border-transparent bg-white/90")}>
  <nav aria-label="Primary" className="relative mx-auto flex min-h-[68px] max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5">
   <Link href="/" onClick={dismiss} className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" aria-label="42 LMS home">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/assets/images/legacy-42lms-logo.svg" width={151} height={37} alt="42 LMS" className="h-[37px] w-[151px] object-contain"/>
   </Link>
   <div className="hidden min-[992px]:flex items-center gap-5">
    {NAV.map(item=><Link key={item.href} href={item.href} className={navLink}>{item.label}</Link>)}
    <Link href="/login" className={navLink}>Login</Link>
    <Link href="/request-demo" className={demoLink}>Request a Demo <span aria-hidden="true" className="ml-2">↗</span></Link>
   </div>
   <button ref={button} type="button" aria-label="Toggle menu" aria-expanded={open} aria-controls="marketing-mobile-menu"
    onClick={()=>setOpen(value=>!value)}
    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--lms-canvas-border)] text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[992px]:hidden">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
     {open?<path d="M5 5l14 14M19 5L5 19"/>:<path d="M4 6h16M4 12h16M4 18h16"/>}
    </svg>
   </button>
   <div id="marketing-mobile-menu" hidden={!open} className="absolute inset-x-0 top-full z-40 border-b border-[var(--lms-canvas-border)] bg-white px-5 pb-5 pt-2 shadow-xl min-[992px]:!hidden">
    <div className="flex flex-col items-stretch gap-1">
     {NAV.map(item=><Link onClick={dismiss} key={item.href} href={item.href} className={navLink}>{item.label}</Link>)}
     <Link href="/login" onClick={dismiss} className={navLink}>Login</Link>
     <Link href="/request-demo" onClick={dismiss} className={demoLink}>Request a Demo <span aria-hidden="true" className="ml-2">↗</span></Link>
    </div>
   </div>
  </nav>
 </header>;
}
