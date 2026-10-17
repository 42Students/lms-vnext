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
