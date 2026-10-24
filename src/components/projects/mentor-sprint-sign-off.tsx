"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";

type UnfinishedTask={id:string;title:string;status:string};

/** Sign off only after task reviews are resolved. The migrated domain service
 * already carries every unfinished sprint task into the backlog atomically.
 * Never pretend per-task next-sprint/drop choices are persisted if they aren't.
 * An optional next-sprint start is a second explicit mutation, with truthful
 * partial-success feedback if it fails. */
export function MentorSprintSignOff({
  projectId,sprintId,title,unfinished,nextSprint,
}:{
  projectId:string;sprintId:string;title:string;
  unfinished:readonly UnfinishedTask[];
  nextSprint?:{id:string;title:string}|null;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [note,setNote]=useState("");
  const [startNext,setStartNext]=useState(Boolean(nextSprint));
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const waiting=unfinished.filter(task=>task.status==="IN_REVIEW");
  const carried=unfinished.filter(task=>task.status!=="IN_REVIEW");
  const canSign=waiting.length===0&&!pending;
  async function signOff(){
    if(!canSign)return;
    setPending(true);setError(null);
    try{
      await projectMutation(
        "/api/projects/"+encodeURIComponent(projectId)+
          "/sprints/"+encodeURIComponent(sprintId)+"/complete",
        "POST",{note:note.trim()||undefined},
      );
    }catch{
      setError("Sprint could not be signed off. Review the latest tasks and try again.");
      setPending(false);
      return;
    }
    if(nextSprint&&startNext){
      try{
        await projectMutation(
          "/api/projects/"+encodeURIComponent(projectId)+
            "/sprints/"+encodeURIComponent(nextSprint.id)+"/start",
          "POST",
        );
      }catch{
        setOpen(false);setPending(false);router.refresh();
        showToast({tone:"error",title:"Sprint signed off; next sprint not started",
          description:"The completed sprint is saved. Start the next sprint separately after checking its status."});
        return;
      }
    }
    setOpen(false);setPending(false);setNote("");
    showToast({tone:"success",title:nextSprint&&startNext?
      "Sprint signed off and next sprint started":"Sprint signed off",
      ...(unfinished.length?{description:
        unfinished.length+" unfinished tasks were carried into the backlog."}:{}),});
    router.refresh();
  }
  return <>
    <Button size="sm" variant="secondary" type="button" onClick={()=>setOpen(true)}>
      Sign off sprint
    </Button>
    <Dialog open={open} title={"Sign off "+title}
      description="Approve submitted work first. Completing the sprint carries unfinished tasks into the product backlog."
      onOpenChange={value=>{if(!pending)setOpen(value);}}>
      <div className="prototype-mentor-signoff">
        <p><strong>{unfinished.length}</strong> unfinished tasks ·
          <strong> {waiting.length}</strong> waiting for your review.</p>
        {waiting.length?<div className="prototype-mentor-signoff-waiting" role="status">
          Review these tasks before signing off:
          <ul>{waiting.map(task=><li key={task.id}>{task.title}</li>)}</ul>
          <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=board&lane=IN_REVIEW"}>
            Open tasks waiting for review →
          </Link>
        </div>:null}
        {carried.length?<div>
          <h3>Unfinished · where will these go?</h3>
          <p>The current project lifecycle moves them into the backlog. They can be assigned to
            the next sprint from the project task planner after sign-off.</p>
          <ul>{carried.map(task=><li key={task.id}>
            <strong>{task.title}</strong><span>→ Product backlog</span>
          </li>)}</ul>
        </div>:null}
        <label>
          A note to the team, shown in sprint activity (optional)
          <Textarea maxLength={1000} rows={3} value={note}
            onChange={event=>setNote(event.target.value)}
            placeholder="How did this sprint go? What should the team carry forward?"
            disabled={pending}/>
        </label>
        {nextSprint?<label className="prototype-mentor-signoff-next">
          <input type="checkbox" checked={startNext} disabled={pending}
            onChange={event=>setStartNext(event.target.checked)}/>
          Start next sprint: {nextSprint.title}
        </label>:null}
        {error?<p role="alert" className="text-error">{error}</p>:null}
        <div className="prototype-mentor-signoff-actions">
          <Button type="button" variant="secondary" disabled={pending}
            onClick={()=>setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={!canSign} loading={pending}
            onClick={()=>void signOff()}>
            {waiting.length?"Approve tasks first":nextSprint&&startNext?
              "Sign off and start next sprint":"Sign off sprint"}
          </Button>
        </div>
      </div>
    </Dialog>
  </>;
}
