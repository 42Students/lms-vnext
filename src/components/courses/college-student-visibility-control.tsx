"use client";
import {FilterChip} from "@/components/ui/filter-chip";
import { Alert } from "@/components/ui/alert";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {collegeStudentVisibilityAction} from "@/modules/courses/college-student-visibility-control-model";
export function CollegeStudentVisibilityControl({contentId,initialVisible,initialUpdatedAt}:{
  contentId:string;initialVisible:boolean;initialUpdatedAt:string;
}){
  const router=useRouter();
  const [visible,setVisible]=useState(initialVisible);
  const [version,setVersion]=useState(initialUpdatedAt);
  const [notice,setNotice]=useState("");
  const [pending,start]=useTransition();
  const action=collegeStudentVisibilityAction(visible);
  function toggle(){
    if(!window.confirm(action.confirmation))return;
    setNotice("");
    start(async()=>{
      try {
        const response=await fetch("/api/courses/college-content-visibility",{
          method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({
            lessonContentId:contentId,visibleToStudents:action.next,
            expectedUpdatedAt:version,confirmed:true,
          }),
        });
        if(!response.ok){
          const body=await response.json().catch(()=>null) as {error?:string}|null;
          throw new Error(body?.error==="LESSON_CONTENT_STALE_VERSION"?
            "Another administrator updated this content. Refresh to review its current setting.":
            "Unable to change student visibility. Refresh and try again.");
        }
        const result=await response.json() as {visibleToStudents:boolean;updatedAt:string};
        setVisible(result.visibleToStudents);
        setVersion(result.updatedAt);
        router.refresh();
      }catch(error){
        setNotice(error instanceof Error?error.message:"Visibility update unavailable.");
      }
    });
  }
  return <div className="mt-2 min-w-0 space-y-1">
    <FilterChip type="button" disabled={pending} onClick={toggle}
      aria-label={action.label} aria-pressed={visible}
      className="min-h-11 max-w-full text-xs md:min-h-9">
      {pending?"Saving…":action.label}
    </FilterChip>
    {notice?<Alert tone="error">{notice}</Alert>:null}
  </div>;
}
