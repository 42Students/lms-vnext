"use client";
import {createContext,useContext,useEffect,useMemo,useState,type Dispatch,type ReactNode,type SetStateAction} from "react";
type Selection={selected:readonly string[];setSelected:Dispatch<SetStateAction<string[]>>;allIds:readonly string[];totalCount:number;notice:string};
const StudentSelectionContext=createContext<Selection|null>(null);
/** Session-only selection survives page navigation, scoped to the authorized college, member and exact filter. */
export function TpoStudentsSelectionProvider({children,scopeKey,allowedIds,totalCount}:{children:ReactNode;scopeKey:string;allowedIds:readonly string[];totalCount:number}){
 const [selected,setSelected]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const allowed=useMemo(()=>new Set(allowedIds),[allowedIds]);
 const key="tpo:selection:v3:"+scopeKey;
 const membershipKey=scopeKey.split(":",1)[0];
 const marker="tpo:selection:last-filter:"+membershipKey;
 useEffect(()=>{
  const frame=window.requestAnimationFrame(()=>{
   try{
    const previous=window.sessionStorage.getItem(marker);
    if(previous&&previous!==key){
     const old:unknown=JSON.parse(window.sessionStorage.getItem(previous)??"[]");
     if(Array.isArray(old)&&old.length)setNotice("Selected students hidden by these filters were unticked.");
     window.sessionStorage.removeItem(previous);
    }
    window.sessionStorage.setItem(marker,key);
    const parsed:unknown=JSON.parse(window.sessionStorage.getItem(key)??"[]");
    if(Array.isArray(parsed))setSelected(parsed.filter((id):id is string=>typeof id==="string"&&allowed.has(id)).slice(0,5000));
   }catch{setSelected([]);}
  });
  return ()=>window.cancelAnimationFrame(frame);
 },[key,allowed,marker]);
 const setSafe:Dispatch<SetStateAction<string[]>>=update=>{
  setSelected(current=>{
   const proposed=typeof update==="function"?update(current):update;
   const next=[...new Set(proposed.filter(id=>allowed.has(id)))].slice(0,5000);
   try{window.sessionStorage.setItem(key,JSON.stringify(next));}catch{/* Disabled storage affects only persistence. */}
   return next;
  });
 };
 return <StudentSelectionContext.Provider value={{selected,setSelected:setSafe,allIds:allowedIds,totalCount,notice}}>{children}</StudentSelectionContext.Provider>;
}
export function useTpoStudentsSelection(){return useContext(StudentSelectionContext);}
export function TpoStudentsSelectionSummary({visibleIds,totalCount}:{visibleIds:readonly string[];totalCount:number}){
 const selection=useTpoStudentsSelection();
 if(!selection)return null;
 const selectedCount=selection.selected.filter(id=>selection.allIds.includes(id)).length;
 return <p role="status" aria-live="polite" className="text-sm text-body">
  {visibleIds.length} shown of {totalCount} in this view · {selectedCount} selected of {totalCount}
  {selection.notice?<span className="ml-2 font-semibold">{selection.notice}</span>:null}
 </p>;
}
