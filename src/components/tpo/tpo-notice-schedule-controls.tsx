"use client";
import {useState} from "react";

export function TpoNoticeScheduleControls({count,enabled,minDateTime}:{
 count:number|null;enabled:boolean;minDateTime?:string;
}){
 const [mode,setMode]=useState<"NOW"|"LATER">("NOW");
 return <div className="space-y-3">
  <fieldset className="space-y-2">
   <legend className="text-sm font-semibold text-foreground">When</legend>
   <div className="flex flex-wrap gap-4 text-sm">
    <label className="flex items-center gap-2"><input type="radio" checked={mode==="NOW"}
      onChange={()=>setMode("NOW")} name="noticeWhen" value="NOW"/> Now</label>
    <label className="flex items-center gap-2"><input type="radio" checked={mode==="LATER"}
      onChange={()=>setMode("LATER")} name="noticeWhen" value="LATER"/> Later</label>
   </div>
  </fieldset>
  {mode==="LATER"?<label className="grid gap-1 text-sm">Schedule for (IST)
    <input type="datetime-local" name="sendAt" required min={minDateTime}
      className="min-h-11 sm:min-h-9 rounded-[9px] border border-border bg-surface px-3"/>
   </label>:null}
  <button type="submit" disabled={!enabled}
   className="min-h-11 sm:min-h-9 rounded-[9px] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50">
   {mode==="LATER"?"Schedule":"Send"} {count===null?"announcement":"to "+count+" members"}
  </button>
 </div>;
}
