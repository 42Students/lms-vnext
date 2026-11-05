"use client";

import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
import type {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {FacultyAssessmentOverview} from "./faculty-assessment-overview";
import { Heading } from "@/components/ui/heading";

type Overview=Awaited<ReturnType<typeof getFacultyAssessmentOverview>>;
type Snapshot={overview:Overview;filesEnabled:boolean};
type Retention={last:Snapshot|null;save:(data:Snapshot)=>void};
const Context=createContext<Retention|null>(null);

/** Lives in the role+membership keyed server layout. Retains only this
 * mounted page's in-memory rows (never browser storage or another college).
 * When a server refresh throws, the layout survives the page error boundary.
 */
export function FacultyAssignmentsRetention({children}:{children:ReactNode}){
 const [last,setLast]=useState<Snapshot|null>(null);
 return <Context.Provider value={{last,save:setLast}}>{children}</Context.Provider>;
}
export function RetainedFacultyAssignments({overview,filesEnabled}:Snapshot){
 const retention=useContext(Context);
 useEffect(()=>{retention?.save({overview,filesEnabled});},[overview,filesEnabled,retention?.save]);
 return <FacultyAssessmentOverview filesEnabled={filesEnabled} overview={overview} kind="ASSIGNMENT"/>;
}
export function FacultyAssignmentsFailure({reset}:{reset:()=>void}){
 const previous=useContext(Context)?.last;
 return <section className="min-w-0 space-y-4">
  <PageHeader title="My Assignments"/>
  {previous?<Alert tone="warning">Couldn&apos;t refresh assignments. Showing the last successfully loaded list for this workspace. Check your connection and try again.</Alert>:
   <Alert tone="error">Couldn&apos;t load assignments. Check your connection and try again.</Alert>}
  <Button type="button" onClick={reset}>Retry</Button>
  {previous?<section aria-label="Previous assignments" className="space-y-2">
    <Heading level={2} className="text-body">Previously loaded assignments (read only)</Heading>
    <div className="divide-y divide-border border-y border-border">
     {previous.overview.assignments.map(item=><article key={item.deliveryId+":"+item.id}
       className="grid min-w-0 gap-1 py-3 text-sm">
       <Heading level={3} className="break-words text-foreground">{item.title}</Heading>
       <p className="text-body">{item.courseCode} · {item.courseName} · {item.sectionName}</p>
       <p className="text-muted-foreground">Status: {item.status}</p>
     </article>)}
    </div>
   </section>:null}
 </section>;
}
