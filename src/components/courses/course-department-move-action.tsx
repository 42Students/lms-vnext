"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Select} from "@/components/ui/select";
import {Alert} from "@/components/ui/alert";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {academicSetupErrorMessage} from "@/modules/academics/academic-setup-error-copy";

/** Only the existing scoped service can authorize and persist a move.
 * The picker is a suggestion, never a source of tenant authorization. */
export function CourseDepartmentMoveAction({
  course,departments,activeOfferingCount,
}:{
  course:{id:string;name:string;departmentId:string;updatedAt:string};
  departments:readonly {id:string;name:string}[];
  activeOfferingCount:number;
}){
  const router=useRouter();
  const busyRef=useRef(false);
  const [open,setOpen]=useState(false);
  const [target,setTarget]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const options=departments.filter(item=>item.id!==course.departmentId);
  async function move(){
    if(busyRef.current||!target||target===course.departmentId||activeOfferingCount>0)return;
    busyRef.current=true;setPending(true);setError("");
    try{
      await apiFetch("/api/courses/"+encodeURIComponent(course.id)+"/department",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({departmentId:target,expectedUpdatedAt:course.updatedAt}),
      });
      setOpen(false);
      router.refresh();
    }catch(reason){
      setError(reason instanceof FriendlyFetchError&&reason.code==="COURSE_STALE_VERSION"
        ?"This course was modified by someone else. Refresh and reapply your changes."
        :academicSetupErrorMessage(reason,
          "Department could not be changed. Courses with existing Offerings cannot move."));
    }finally{busyRef.current=false;setPending(false);}
  }
  if(options.length===0)return null;
  return <>
    <Button size="sm" variant="secondary" type="button"
      disabled={activeOfferingCount>0}
      title={activeOfferingCount>0?"Resolve active Course Offerings before moving departments.":undefined}
      onClick={()=>{setTarget(options[0]?.id??"");setError("");setOpen(true);}}>
      Move department
    </Button>
    <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}
      dismissible={!pending} title={"Move “"+course.name+"”"}
      description="You can move an unused Course only to another department in the same college. Any current or historical Offering prevents moving; learner and course history remain attached."
      footer={<div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={pending}
          onClick={()=>setOpen(false)}>Cancel</Button>
        <Button type="button" variant="primary" loading={pending}
          disabled={pending||!target||target===course.departmentId}
          onClick={()=>void move()}>Move department</Button>
      </div>}>
      <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
        New department
        <Select value={target} disabled={pending}
          onChange={event=>{setTarget(event.target.value);setError("");}}>
          <option value="">Choose a department</option>
          {options.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      {error?<Alert tone="error" role="alert" className="mt-3">{error}</Alert>:null}
    </Dialog>
  </>;
}
