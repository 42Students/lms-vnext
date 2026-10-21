"use client";

import { useEffect, useRef, useState } from "react";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";

export function DepartmentCreateForm({collegeId}:{collegeId:string}) {
  void collegeId; // College identity is scoped by the server request context.
  const router=useRouter();
  const [name,setName]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [fieldError,setFieldError]=useState("");
  const [notice,setNotice]=useState<string|null>(null);
  const noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const {pending,run}=useGuardedAction({timeoutMs:30000});
  useEffect(()=>()=>{if(noticeTimer.current)clearTimeout(noticeTimer.current);},[]);
  function announce(text:string){
    if(noticeTimer.current)clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current=setTimeout(()=>setNotice(null),3000);
  }
  function fail(detail:string,field=""){
    setError(detail);
    setFieldError(field);
  }
  function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setError(null);setFieldError("");setNotice(null);
    if(!name.trim()){
      fail(name.length?"Department name cannot be empty":"Please enter department name",
        name.length?"Department name cannot be empty":"Please enter department name");
      return;
    }
    if(name.trim().length>255){
      fail("Department name must be 255 characters or less","Department name must be 255 characters or less");
      return;
    }
    void run(async()=>{
      try{
        const response=await fetch("/api/college/departments",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({name:name.trim()}),
        });
        if(!response.ok){
          const payload:unknown=await response.json().catch(()=>null);
          const data=payload&&typeof payload==="object"?payload as Record<string,unknown>:{};
          const conflict=data.error==="DEPARTMENT_NAME_CONFLICT";
          const fieldErrors=data.fieldErrors&&typeof data.fieldErrors==="object"
            ?data.fieldErrors as Record<string,unknown>:{};
          const missingCollege=typeof fieldErrors.college_id==="string"||
            typeof fieldErrors.collegeId==="string";
          const detail=conflict?"Department name already exists":
            missingCollege?"Please select college":
            "Failed to create department";
          fail(detail,conflict?detail:"");
          return;
        }
        announce("Created department “"+name.trim()+"”. Next, add programs or courses under it.");
        setName("");router.refresh();
      }catch{fail("Failed to create department");}
    }).catch(()=>fail("Failed to create department"));
  }
  return (
    <form onSubmit={submit} aria-label={DEPARTMENT_COPY.createCardTitle}
      className="grid min-w-0 max-w-[920px] grid-cols-1 items-end gap-[var(--lms-space-3)] print:hidden sm:grid-cols-[minmax(0,1fr)_auto]">
      <h2 className="m-0 min-w-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)] sm:col-span-2">
        {DEPARTMENT_COPY.createCardTitle}
      </h2>
      <div className="min-w-0 w-full flex-1">
        <label htmlFor="department-name" className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {DEPARTMENT_COPY.nameLabel}<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
        </label>
        <Input className="min-h-11 md:min-h-9" id="department-name"
          value={name} onChange={event=>{setName(event.target.value);setFieldError("");}}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError?"department-name-error":undefined}
          maxLength={255} placeholder={DEPARTMENT_COPY.namePlaceholder}/>
        {fieldError?<p id="department-name-error" className="mt-1 text-xs text-error">{fieldError}</p>:null}
      </div>
      <Button type="submit" className="min-h-11 w-full justify-center sm:w-auto md:min-h-9" disabled={pending}>
        {pending?"Creating…":DEPARTMENT_COPY.createButton}
      </Button>
      {notice?<p role="status" className="m-0 w-full min-w-0 break-words text-sm leading-[22px] text-success-text sm:col-span-2">{notice}</p>:null}
      {error?<div role="alert" className="relative w-full min-w-0 space-y-1 border-l-2 border-error bg-error-subtle p-3 pr-10 text-sm text-error sm:col-span-2">
        <strong className="block">{DEPARTMENT_COPY.createFailed}</strong>
        <p className="break-words">{error}</p>
        <Button variant="ghost" type="button" aria-label="Dismiss department error" onClick={()=>{setError(null);setFieldError("");}}
          className="absolute right-2 top-2" title="Dismiss error">×</Button>
      </div>:null}
    </form>
  );
}
