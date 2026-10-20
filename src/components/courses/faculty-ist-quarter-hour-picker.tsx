"use client";
import {Input} from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

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
  <legend className="mb-1 text-[13px] leading-4 font-semibold text-body">{label} (IST)</legend>
  <div className="grid min-w-0 grid-cols-3 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
   <label className="col-span-3 grid min-w-0 gap-1 text-[13px] font-semibold leading-4 md:col-span-1">Date
    <Input type="date" required aria-label={label+" date"} value={parts.date}
     onChange={event=>emit(event.target.value)}
     className="min-w-0"/>
   </label>
   <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4">Hour
    <Select aria-label={label+" hour (12-hour clock)"} value={hour}
     onChange={event=>emit(parts.date,event.target.value)}
     className="min-w-0">
     {Array.from({length:12},(_,i)=>String(i+1)).map(h=>
      <option key={h} value={h}>{h}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4">Minute
    <Select aria-label={label+" minute (15-minute steps)"} value={minute}
     onChange={event=>emit(parts.date,hour,event.target.value)}
     className="min-w-0">
     {FACULTY_IST_QUARTER_MINUTES.map(m=><option key={m} value={m}>{m}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4">AM/PM
    <Select aria-label={label+" AM or PM"} value={parts.period}
     onChange={event=>emit(parts.date,hour,minute,event.target.value as "AM"|"PM")}
     className="min-w-0">
     <option value="AM">AM</option><option value="PM">PM</option>
    </Select>
   </label>
  </div>
  {parts.minute&&!(FACULTY_IST_QUARTER_MINUTES as readonly string[]).includes(parts.minute)?
   <Alert tone="warning">This saved time is not on a 15-minute interval. Choose a quarter-hour before saving.</Alert>:null}
 </fieldset>;
}
