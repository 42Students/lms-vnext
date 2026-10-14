"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";

export function MentorTaskCreate({
  projectId,sprintId,updatedAt,
}:{projectId:string;sprintId:string;updatedAt:string}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [criteria,setCriteria]=useState("");
  const [priority,setPriority]=useState<"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">("MEDIUM");
  const valid=title.trim().length>0&&title.trim().length<=200&&
    description.length<=4000&&criteria.length<=4000;
  async function create(){
    if(!valid)return;
    setBusy(true);
    try{
      await projectMutation("/api/projects/"+projectId+"/tasks","POST",{
        sprintId,title:title.trim(),description:description.trim()||null,
        acceptanceCriteria:criteria.trim()||null,
        priority,expectedSprintUpdatedAt:updatedAt,
      });
      showToast({tone:"success",title:"Project task created"});
      setOpen(false);setTitle("");setDescription("");setCriteria("");setPriority("MEDIUM");
      router.refresh();
    }catch(error){
      showToast({tone:"error",title:"Task was not created",
        description:error instanceof Error?error.message:"Refresh and retry."});
    }finally{setBusy(false);}
  }
  return <>
    <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>Add task</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Confirm new task"
      description="Creates a TODO task in this Sprint and records an audit event. Assignee, estimate and workload tracking are unavailable until their registered storage is added."
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
        <Button disabled={busy||!valid} onClick={()=>void create()}>
          {busy?"Creating…":"Confirm create"}
        </Button>
      </>}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Task title
          <Input value={title} maxLength={200} required onChange={e=>setTitle(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Description
          <Textarea value={description} maxLength={4000} onChange={e=>setDescription(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Acceptance criteria
          <Textarea value={criteria} maxLength={4000} onChange={e=>setCriteria(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Priority
          <select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </select>
        </label>
        <p className="text-xs text-muted-foreground">
          This action cannot assign Learners or record estimates; the Board remains the source of truth.
        </p>
      </div>
    </Dialog>
  </>;
}
