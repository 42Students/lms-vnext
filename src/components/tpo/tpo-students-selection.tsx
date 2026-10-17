"use client";
import {createContext,useContext,useState,type Dispatch,type ReactNode,type SetStateAction} from "react";
type Selection={selected:readonly string[];setSelected:Dispatch<SetStateAction<string[]>>};
const StudentSelectionContext=createContext<Selection|null>(null);
/** One selection for student notes, bulk actions and Add to Drive; keyed by page filters. */
export function TpoStudentsSelectionProvider({children}:{children:ReactNode}){
 const [selected,setSelected]=useState<string[]>([]);
 return <StudentSelectionContext.Provider value={{selected,setSelected}}>{children}</StudentSelectionContext.Provider>;
}
export function useTpoStudentsSelection(){return useContext(StudentSelectionContext);}

/** Visible counts are scoped to the current authorized roster page. */
export function TpoStudentsSelectionSummary({visibleIds,totalCount}:{visibleIds:readonly string[];totalCount:number}){
 const selection=useTpoStudentsSelection();
 if(!selection)return null;
 const selectedCount=selection.selected.filter(id=>visibleIds.includes(id)).length;
 return <p role="status" aria-live="polite" className="text-sm text-body">
  {visibleIds.length} of {totalCount} in this view · {selectedCount} selected
 </p>;
}
