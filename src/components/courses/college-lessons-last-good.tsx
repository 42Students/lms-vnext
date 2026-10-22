"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";

type Snapshot={query:string;content:ReactNode};
type Memory={last:Snapshot|null;save:(query:string,content:ReactNode)=>void};
const MemoryContext=createContext<Memory|null>(null);

/** Scoped by the server-rendered membership layout; a query-key guard also
 * prevents showing a different course/lesson filter as a stale result.
 * No report rows are written to browser storage or sent to telemetry. */
export function CollegeLessonsMemory({children}:{children:ReactNode}){
 const [last,setLast]=useState<Snapshot|null>(null);
 const save=useCallback((query:string,content:ReactNode)=>{
  setLast(old=>old?.query===query&&old.content===content?old:{query,content});
 },[]);
 return <MemoryContext.Provider value={{last,save}}>{children}</MemoryContext.Provider>;
}
export function CollegeLessonsCapture({children,query}:{children:ReactNode;query:string}){
 const memory=useContext(MemoryContext);
 const save=memory?.save;
 useEffect(()=>{save?.(query,children);},[query,children,save]);
 return <>{children}</>;
}
export function useLastCollegeLessons(query:string){
 const snapshot=useContext(MemoryContext)?.last;
 return snapshot?.query===query?snapshot.content:null;
}
