"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import Link from "next/link";

type Snapshot={route:string;content:ReactNode};
type Store={previous:Snapshot|null;save:(route:string,content:ReactNode)=>void};
const Context=createContext<Store|null>(null);
export function CollegeInterviewsMemory({children}:{children:ReactNode}){
  const [previous,setPrevious]=useState<Snapshot|null>(null);
  const save=useCallback((route:string,content:ReactNode)=>{
    setPrevious(old=>old?.route===route&&old.content===content?old:{route,content});
  },[]);
  return <Context.Provider value={{previous,save}}>{children}</Context.Provider>;
}
export function CollegeInterviewsCapture({children}:{children:ReactNode}){
  const save=useContext(Context)?.save;
  useEffect(()=>{save?.(window.location.pathname+window.location.search,children);},[children,save]);
  return <>{children}</>;
}
export function CollegeInterviewsStaleFallback({retryHref}:{retryHref:string}){
  const previous=useContext(Context)?.previous;
  const sameRoute=previous?.route===(
    typeof window==="undefined"?"":window.location.pathname+window.location.search);
  return <div className="min-w-0 space-y-3">
    <div role="alert" className="border-l-2 border-warning bg-warning-subtle p-3 text-sm">
      <strong>Couldn't refresh interviews.</strong>{" "}
      {sameRoute?"Showing the last successfully loaded interview schedule; it may be out of date. Changes are unavailable until refresh succeeds.":"The latest interview schedule could not be loaded."}
      {" "}<Link href={retryHref} prefetch={false} className="font-semibold text-link underline">Retry</Link>
    </div>
    {sameRoute?<div aria-label="Previously loaded interview schedule" className="pointer-events-none opacity-80">{previous.content}</div>:null}
  </div>;
}
