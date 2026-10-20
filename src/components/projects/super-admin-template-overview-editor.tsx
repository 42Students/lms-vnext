"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {projectTemplateBlueprintSchema,type ProjectTemplateBlueprint} from "@/modules/projects/validation";
const field="mt-1 w-full";
const lines=(list?:string[])=>list?.join("\n")??"";
const array=(value:string)=>value.split("\n").map(v=>v.trim()).filter(Boolean);
export function SuperAdminTemplateOverviewEditor({templateId,title,summary,version,blueprint}:{
 templateId:string;title:string;summary:string|null;version:number;blueprint:ProjectTemplateBlueprint;
}){
 const router=useRouter(),[open,setOpen]=useState(false),[pending,setPending]=useState(false),
 [error,setError]=useState(""),[message,setMessage]=useState("");
 const [courseLabel,setCourseLabel]=useState(blueprint.overview.courseLabel??""),
 [phase,setPhase]=useState(blueprint.overview.phase??""),
 [goal,setGoal]=useState(blueprint.overview.goal??""),
 [description,setDescription]=useState(blueprint.overview.description??""),
 [deliverables,setDeliverables]=useState(lines(blueprint.overview.deliverables)),
 [done,setDone]=useState(lines(blueprint.overview.definitionOfDone)),
 [personas,setPersonas]=useState(lines(blueprint.overview.personas)),
 [submissionType,setSubmissionType]=useState(blueprint.overview.submissionType??"LINK"),
 [instructions,setInstructions]=useState(blueprint.overview.submissionInstructions??"");
 async function save(){
  const updated={...blueprint,overview:{
   ...blueprint.overview,goal:goal.trim()||undefined,description:description.trim()||undefined,
   courseLabel:courseLabel.trim()||undefined,phase:phase.trim()||undefined,
   deliverables:array(deliverables),definitionOfDone:array(done),personas:array(personas),
   submissionType:submissionType as "LINK"|"FILE"|"TEXT",
   submissionInstructions:instructions.trim()||undefined,
  }};
  const parsed=projectTemplateBlueprintSchema.safeParse(updated);
  if(!parsed.success){setError(parsed.error.issues[0]?.message??"Invalid overview");return;}
  if(!window.confirm("Save template Overview as a new version?"))return;
  setPending(true);setError("");
  try{
   await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"PATCH",{
    title,summary:summary??undefined,expectedVersion:version,
    blueprint:parsed.data,changeNote:"Updated template overview",
   });
   setMessage("Template Overview saved.");setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not save overview");}
  finally{setPending(false);}
 }
 return <section className="space-y-3 border-b border-border pb-5 text-body">
  <Button type="button" variant="secondary" onClick={()=>setOpen(x=>!x)}
   className="">
   {open?"Close Overview editor":"Edit Overview"}
  </Button>
  {open?<div className="grid gap-3 min-[768px]:grid-cols-2">
   <label className="text-[13px] font-semibold text-body">Course label
    <Input className={field} maxLength={160} value={courseLabel} onChange={e=>setCourseLabel(e.target.value)}/></label>
   <label className="text-[13px] font-semibold text-body">Phase
    <Input className={field} maxLength={120} value={phase} onChange={e=>setPhase(e.target.value)}/></label>
   <label className="text-sm font-semibold text-body min-[768px]:col-span-2">Goal
    <Textarea className={field+" min-h-16"} maxLength={2000} value={goal} onChange={e=>setGoal(e.target.value)}/></label>
   <label className="text-sm font-semibold text-body min-[768px]:col-span-2">Description
    <Textarea className={field+" min-h-20"} maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
   {([{label:"Deliverables (one per line)",value:deliverables,set:setDeliverables},
      {label:"Definition of done (one per line)",value:done,set:setDone},
      {label:"Personas (one per line)",value:personas,set:setPersonas}]).map(item=>
    <label key={item.label} className="text-sm font-semibold text-body min-[768px]:col-span-2">{item.label}
     <Textarea className={field+" min-h-20"} value={item.value} onChange={e=>item.set(e.target.value)}/>
    </label>)}
   <label className="text-[13px] font-semibold text-body">Submission type
    <Select className={field} value={submissionType} onChange={e=>setSubmissionType(e.target.value as typeof submissionType)}>
     <option value="LINK">Link</option><option value="FILE">File upload</option><option value="TEXT">Text</option>
    </Select></label>
   <label className="text-sm font-semibold text-body min-[768px]:col-span-2">Submission instructions
    <Textarea className={field+" min-h-20"} maxLength={4000} value={instructions}
     onChange={e=>setInstructions(e.target.value)}/></label>
   <div className="md:col-span-2"><Button type="button" variant="primary" disabled={pending}
     onClick={()=>void save()} className="">
     {pending?"Saving…":"Save as new version"}</Button></div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-success">{message}</p>:null}
 </section>;
}
