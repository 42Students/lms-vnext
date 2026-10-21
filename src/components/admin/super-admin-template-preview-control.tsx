"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ProjectTemplateView} from "@/components/projects/project-template-view";

/** Preview only the version already authorized and loaded by the template page. */
export function SuperAdminTemplatePreviewControl({title,blueprint}:{title:string;blueprint:unknown}){
 const [open,setOpen]=useState(false);
 return <>
  <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>Preview</Button>
  <Dialog open={open} onOpenChange={setOpen} title={"Preview · "+title}
   description="Read-only preview of the current authorized template version."
   className="max-w-[820px]"
   footer={<Button variant="secondary" onClick={()=>setOpen(false)}>Close</Button>}>
   <ProjectTemplateView blueprint={blueprint}/>
  </Dialog>
 </>;
}
