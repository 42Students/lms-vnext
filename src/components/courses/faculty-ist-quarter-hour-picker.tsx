"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {facultyIstTimeParts,facultyIstWallTime,FACULTY_IST_QUARTER_MINUTES}
 from "@/modules/courses/faculty-ist-quarter-hour-model";

/** Explicit 12-hour selectors: browser datetime-local clocks vary by locale. */
export function FacultyIstQuarterHourPicker({label,value,onChange,disabled=false}:{
 label:string;value:string;onChange:(value:string)=>void;disabled?:boolean;
}){
 const parts=facultyIstTimeParts(value);
 const hour=parts.hour||"9";
 const minute=(FACULTY_IST_QUARTER_MINUTES as readonly string[]).includes(parts.minute)?parts.minute:"00";
 function emit(date:string,nextHour=hour,nextMinute=minute,nextPeriod=parts.period){
  onChange(facultyIstWallTime(date,nextHour,nextMinute,nextPeriod));
 }
 return <fieldset disabled={disabled} className="min-w-0 space-y-1">
  <legend className="mb-1 text-sm font-semibold text-body">{label} (IST)</legend>
  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2">
   <label className="grid min-w-0 gap-1 text-xs">Date
    <Input type="date" required aria-label={label+" date"} value={parts.date}
     onChange={event=>emit(event.target.value)}
     className="min-h-11 min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 sm:min-h-9"/>
   </label>
   <label className="grid gap-1 text-xs">Hour
    <Select aria-label={label+" hour (12-hour clock)"} value={hour}
     onChange={event=>emit(parts.date,event.target.value)}
     className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-1 sm:min-h-9">
     {Array.from({length:12},(_,i)=>String(i+1)).map(h=>
      <option key={h} value={h}>{h}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-xs">Minute
    <Select aria-label={label+" minute (15-minute steps)"} value={minute}
     onChange={event=>emit(parts.date,hour,event.target.value)}
     className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-1 sm:min-h-9">
     {FACULTY_IST_QUARTER_MINUTES.map(m=><option key={m} value={m}>{m}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-xs">AM/PM
    <Select aria-label={label+" AM or PM"} value={parts.period}
     onChange={event=>emit(parts.date,hour,minute,event.target.value as "AM"|"PM")}
     className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-1 sm:min-h-9">
     <option value="AM">AM</option><option value="PM">PM</option>
    </Select>
   </label>
  </div>
  {parts.minute&&!(FACULTY_IST_QUARTER_MINUTES as readonly string[]).includes(parts.minute)?
   <p role="status" className="text-xs text-warning">This saved time is not on a 15-minute interval. Choose a quarter-hour before saving.</p>:null}
 </fieldset>;
}
