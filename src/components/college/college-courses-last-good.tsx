"use client";
import {useEffect,useState,type ComponentProps} from "react";
import {useRouter} from "next/navigation";
import {AdminCourseOverview} from "@/components/courses/admin-course-overview";
import {Button} from "@/components/ui/button";

type Properties=ComponentProps<typeof AdminCourseOverview>;
type Workspace=Properties["workspace"];
type Catalogue=NonNullable<Properties["catalogueData"]>;

/** React state survives failed same-route refreshes but is keyed by college and filters. */
export function CollegeCoursesLastGood({workspace,catalogueData,catalogueQuery,duplicateCourseId}:{
  workspace:Workspace|null;catalogueData:Catalogue|null;
  catalogueQuery:NonNullable<Properties["catalogueQuery"]>;duplicateCourseId?:string;
}) {
  const router=useRouter();
  const [last,setLast]=useState<{workspace:Workspace;catalogue:Catalogue}|null>(
    workspace&&catalogueData?{workspace,catalogue:catalogueData}:null,
  );
  useEffect(()=>{
    if(workspace&&catalogueData)setLast({workspace,catalogue:catalogueData});
  },[workspace,catalogueData]);
  const current=workspace&&catalogueData?{workspace,catalogue:catalogueData}:last;
  return <section className="min-w-0 space-y-4" aria-label="College course catalogue">
    {(!workspace||!catalogueData)?<div role="alert"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3">
      <p className="flex-1 text-sm text-body">
        Couldn't refresh courses. {current?"Showing last loaded courses for this college and filters.":"The course list could not be loaded."}
      </p>
      <Button type="button" variant="secondary" onClick={()=>router.refresh()}>Retry</Button>
    </div>:null}
    {current?<AdminCourseOverview workspace={current.workspace}
      catalogueQuery={catalogueQuery} catalogueData={current.catalogue}
      duplicateCourseId={workspace&&catalogueData?duplicateCourseId:undefined}
      offeringBasePath="/college/courses/offerings" allowOfferingLifecycle/>:null}
  </section>;
}
