"use client";
import {createContext,useContext,useEffect,useMemo,useState,type Dispatch,type ReactNode,type SetStateAction} from "react";
type Selection={selected:readonly string[];setSelected:Dispatch<SetStateAction<string[]>>;allIds:readonly string[];totalCount:number};
const StudentSelectionContext=createContext<Selection|null>(null);
/** Session-only selection survives page navigation, scoped to the authorized college, member and exact filter. */
export function TpoStudentsSelectionProvider({children,scopeKey,allowedIds,totalCount}:{children:ReactNode;scopeKey:string;allowedIds:readonly string[];totalCount:number}){
 const [selected,setSelected]=useState<string[]>([]);
 const allowed=useMemo(()=>new Set(allowedIds),[allowedIds]);
 const key="tpo:selection:v3:"+scopeKey;
 useEffect(()=>{
  const frame=window.requestAnimationFrame(()=>{
   try{
    const parsed:unknown=JSON.parse(window.sessionStorage.getItem(key)??"[]");
    if(Array.isArray(parsed))setSelected(parsed.filter((id):id is string=>typeof id==="string"&&allowed.has(id)).slice(0,5000));
   }catch{setSelected([]);}
  });
  return ()=>window.cancelAnimationFrame(frame);
 },[key,allowed]);
 const setSafe:Dispatch<SetStateAction<string[]>>=update=>{
  setSelected(current=>{
   const proposed=typeof update==="function"?update(current):update;
   const next=[...new Set(proposed.filter(id=>allowed.has(id)))].slice(0,5000);
   try{window.sessionStorage.setItem(key,JSON.stringify(next));}catch{/* Disabled storage affects only persistence. */}
   return next;
  });
 };
 return <StudentSelectionContext.Provider value={{selected,setSelected:setSafe,allIds:allowedIds,totalCount}}>{children}</StudentSelectionContext.Provider>;
}
export function useTpoStudentsSelection(){return useContext(StudentSelectionContext);}
export function TpoStudentsSelectionSummary({visibleIds,totalCount}:{visibleIds:readonly string[];totalCount:number}){
 const selection=useTpoStudentsSelection();
 if(!selection)return null;
 const selectedCount=selection.selected.filter(id=>selection.allIds.includes(id)).length;
 return <p role="status" aria-live="polite" className="text-sm text-body">
  {visibleIds.length} shown of {totalCount} in this view · {selectedCount} selected of {totalCount}
 </p>;
}
