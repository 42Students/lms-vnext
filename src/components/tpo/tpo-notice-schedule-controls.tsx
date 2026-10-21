"use client";
import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Radio} from "@/components/ui/radio";
import {Button} from "@/components/ui/button";

export function TpoNoticeScheduleControls({count,enabled,minDateTime}:{
 count:number|null;enabled:boolean;minDateTime?:string;
}){
 const [mode,setMode]=useState<"NOW"|"LATER">("NOW");
 return <div className="space-y-3">
  <Input type="hidden" name="when" value={mode}/>
  <fieldset className="space-y-2">
   <legend className="text-sm font-semibold text-foreground">When</legend>
   <div className="flex flex-wrap gap-4 text-sm">
    <label className="flex min-h-11 items-center gap-2 md:min-h-[var(--lms-control-height)]"><Radio checked={mode==="NOW"}
      onChange={()=>setMode("NOW")} name="noticeWhen" value="NOW"/> Now</label>
    <label className="flex min-h-11 items-center gap-2 md:min-h-[var(--lms-control-height)]"><Radio checked={mode==="LATER"}
      onChange={()=>setMode("LATER")} name="noticeWhen" value="LATER"/> Later</label>
   </div>
  </fieldset>
  {mode==="LATER"?<label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Schedule for (IST)
    <Input type="datetime-local" name="sendAt" required min={minDateTime}
      className="min-h-11 min-[768px]:min-h-9"/>
   </label>:null}
  <Button type="submit" disabled={!enabled}
   className="min-h-11 w-full min-[768px]:min-h-9 md:w-auto">
   {mode==="LATER"?"Schedule":"Send"} {count===null?"announcement":"to "+count+" members"}
  </Button>
 </div>;
}
