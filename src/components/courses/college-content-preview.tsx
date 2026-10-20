"use client";
import {useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";

type Preview={title:string;course:string;lesson:string;type:string;status:string;scope:string;visible:boolean;details:string};
export function CollegeContentPreview({data}:{data:Preview}){
 const [open,setOpen]=useState(false);
 return <>
  <Button variant="secondary" onClick={()=>setOpen(true)} aria-haspopup="dialog" className="min-h-11 md:min-h-9">Preview</Button>
  <Dialog open={open} onOpenChange={setOpen} title={data.title} description="Content preview"
   footer={<Button variant="secondary" onClick={()=>setOpen(false)} className="min-h-11 md:min-h-9">Close preview</Button>}>
   <dl aria-label="Content preview" className="divide-y divide-border text-sm text-body">
    {[
      ["Course",data.course],["Lesson",data.lesson],["Content type",data.type],
      ["Status",data.status],["Audience",data.scope],
      ["Students",data.visible?"Visible when published":"Hidden"],["Details",data.details],
    ].map(([label,value])=><div key={label} className="min-w-0 py-3">
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="mt-1 break-words">{label==="Status"?<StatusBadge tone={value==="PUBLISHED"?"success":value==="ARCHIVED"?"neutral":"warning"}>{value}</StatusBadge>:label==="Students"?<StatusBadge tone={data.visible?"success":"neutral"}>{value}</StatusBadge>:value}</dd>
    </div>)}
   </dl>
   <p className="mt-3 text-xs text-muted-foreground">Scoped metadata preview only. Private files, meeting links and signed playback addresses are not exposed here.</p>
  </Dialog>
 </>;
}
