"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

export function MentorSprintCreate({
  projectId, releaseId,releases=[],
}: {projectId:string;releaseId:string;releases?:readonly {id:string;title:string;status:string}[]}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [goal,setGoal]=useState(""),[done,setDone]=useState("");
  const [startDate,setStartDate]=useState(""),[endDate,setEndDate]=useState(""),[dueDate,setDueDate]=useState("");
  const [chosenReleaseId,setChosenReleaseId]=useState(releaseId);
  const chosenRelease=releases.find(item=>item.id===chosenReleaseId);
  const datesValid=(!startDate||!endDate||endDate>=startDate)&&
    (!dueDate||!startDate||dueDate>=startDate);

  async function create() {
    if(!title.trim() || title.trim().length>200 || description.length>4000||
      goal.length>4000||done.length>4000||!datesValid||!chosenReleaseId||
      chosenRelease?.status==="SHIPPED") return;
    setBusy(true);
    try {
      await projectMutation("/api/projects/"+projectId+"/sprints","POST",{
        releaseId:chosenReleaseId,title:title.trim(),description:description.trim()||null,
        goal:goal.trim()||null,definitionOfDone:done.trim()||null,
        startDate:startDate||null,endDate:endDate||null,dueDate:dueDate||null,
      });
      showToast({tone:"success",title:"Sprint created"});
      setOpen(false);setTitle("");setDescription("");
      router.refresh();
    } catch(error) {
      showToast({tone:"error",title:"Could not create sprint",
        description:error instanceof Error?error.message:"Please try again."});
    } finally {setBusy(false);}
  }

  return <>
    <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>
      Add sprint
    </Button>
    <Dialog open={open} onOpenChange={setOpen} title="Create sprint"
      description="Create a planned sprint with goal, dates and definition of done in this release."
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
        <Button disabled={busy||!title.trim()||title.trim().length>200||
          description.length>4000} onClick={()=>void create()}>
          {busy?"Creating…":"Confirm create"}
        </Button>
      </>}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Sprint title
          <Input maxLength={200} value={title}
            onChange={e=>setTitle(e.target.value)} required />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Description
          <Textarea value={description} maxLength={4000}
            onChange={e=>setDescription(e.target.value)}
            placeholder="Optional description" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Sprint goal
          <Textarea maxLength={4000} value={goal} onChange={e=>setGoal(e.target.value)}/></label>
        <label className="grid gap-1 text-sm font-semibold text-body">What does done look like?
          <Textarea maxLength={4000} value={done} onChange={e=>setDone(e.target.value)}/></label>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-semibold">Start date
            <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label>
          <label className="text-xs font-semibold">End date
            <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label>
          <label className="text-xs font-semibold">Due date
            <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>
        </div>
      </div>
    </Dialog>
  </>;
}

export function MentorSprintTransition({
  projectId,sprintId,status,releaseStatus,updatedAt,
}:{
  projectId:string;sprintId:string;status:string;
  releaseStatus:string;updatedAt:string;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [busy,setBusy]=useState(false);
  const action=status==="PLANNED"?"START":
    status==="ACTIVE"?"COMPLETE":
    status==="COMPLETED"&&releaseStatus!=="SHIPPED"?"REOPEN":null;
  if(!action) return null;

  const label=action==="START"?"Start sprint":
    action==="COMPLETE"?"Complete sprint":"Reopen sprint";
  async function transition() {
    if(!action || !window.confirm(label+"? The sprint status and project activity will change.")) return;
    setBusy(true);
    try {
      await projectMutation("/api/projects/"+projectId+"/sprints/"+sprintId+
        "/mentor-transition","POST",{action,expectedUpdatedAt:updatedAt});
      showToast({tone:"success",title:"Sprint status updated"});
      router.refresh();
    } catch(error) {
      showToast({tone:"error",title:"Sprint status was not changed",
        description:error instanceof Error?error.message:"Reload to retry."});
    } finally {setBusy(false);}
  }
  return <Button size="sm" variant="secondary" disabled={busy}
    onClick={()=>void transition()}>
    {busy?"Saving…":label}
  </Button>;
}
