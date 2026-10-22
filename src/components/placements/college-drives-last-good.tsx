"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import Link from "next/link";

type Previous={query:string;content:ReactNode};
type Memory={previous:Previous|null;save:(query:string,content:ReactNode)=>void};
const Cache=createContext<Memory|null>(null);
/** Scope held by the authorized college layout, never localStorage. */
export function CollegeDrivesMemory({children}:{children:ReactNode}){
 const [previous,setPrevious]=useState<Previous|null>(null);
 const save=useCallback((query:string,content:ReactNode)=>{
   setPrevious(old=>old?.query===query&&old.content===content?old:{query,content});
 },[]);
 return <Cache.Provider value={{previous,save}}>{children}</Cache.Provider>;
}
export function CollegeDrivesCapture({children}:{children:ReactNode}){
 const save=useContext(Cache)?.save;
 useEffect(()=>{save?.(window.location.search,children);},[children,save]);
 return <>{children}</>;
}
export function CollegeDrivesStaleFallback({retryHref}:{retryHref:string}){
 const previous=useContext(Cache)?.previous;
 const sameFilters=previous && typeof window!=="undefined" &&
   previous.query===window.location.search;
 return <div className="min-w-0 space-y-3">
  <div role="alert" className="border-l-2 border-warning bg-warning-subtle p-3 text-sm">
    <strong>Couldn't refresh drives.</strong> {sameFilters?
      "Showing the last successful list for this college and these filters; it may be out of date.":
      "The drive list could not be loaded. No unverified or other-college rows are shown."}
    {" "}<Link href={retryHref} prefetch={false}
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
  </div>
  {sameFilters?<section aria-label="Previously loaded drives">{previous.content}</section>:null}
 </div>;
}
