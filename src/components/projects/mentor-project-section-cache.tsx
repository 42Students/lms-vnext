"use client";
import {useEffect,useState,type ReactNode} from "react";

/** Keep visited same-project section trees mounted so a clean open dialog,
 * chosen row, or temporary form focus survives ?tab navigation. The editor
 * discard guards still intercept a dirty draft and require confirmation.
 * Only visited sections are retained (at most eight); changing project ID
 * remounts the host and never carries private workspace data across projects.
 */
export function MentorProjectSectionCache({
  projectId,section,children,
}:{
  projectId:string;section:string;children:ReactNode;
}){
  const [visited,setVisited]=useState<Record<string,ReactNode>>(
    ()=>({[section]:children}),
  );
  useEffect(()=>{
    setVisited(previous=>({...previous,[section]:children}));
  },[section,children]);
  return <div data-project-id={projectId} className="min-w-0">
    {Object.entries(visited).map(([key,content])=>
      <section key={key} aria-label={"Project section "+key}
        aria-hidden={key!==section} className={key===section?
          "min-w-0":"hidden"}>
        {content}
      </section>)}
  </div>;
}
