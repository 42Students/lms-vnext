"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";

type PreviousReport={lastGood:ReactNode|null;save:(content:ReactNode)=>void};
const Context=createContext<PreviousReport|null>(null);

/** Memory-only and keyed by the server-authorized user and membership.
 * Never persist learner report rows in browser storage.
 */
export function CollegeProgressMemory({children}:{children:ReactNode}){
 const [lastGood,setLastGood]=useState<ReactNode|null>(null);
 return <Context.Provider value={{lastGood,save:setLastGood}}>{children}</Context.Provider>;
}
export function CollegeProgressCapture({children}:{children:ReactNode}){
 const context=useContext(Context);
 useEffect(()=>{context?.save(children);},[children,context?.save]);
 return <>{children}</>;
}
export function useLastCollegeProgressReport(){return useContext(Context)?.lastGood??null;}
