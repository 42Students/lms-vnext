"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";

type UnfinishedTask={id:string;title:string;status:string;updatedAt:string};

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
  const [destinations,setDestinations]=useState<Record<string,"NEXT"|"BACKLOG"|"DROP">>({});
  const [dropConfirmed,setDropConfirmed]=useState(false);
  const [startNext,setStartNext]=useState(Boolean(nextSprint));
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const waiting=unfinished.filter(task=>task.status==="IN_REVIEW");
  const carried=unfinished.filter(task=>task.status!=="IN_REVIEW");
  const destinationFor=(taskId:string):"NEXT"|"BACKLOG"|"DROP"=>
    destinations[taskId]??(nextSprint?"NEXT":"BACKLOG");
  const choices=unfinished.map(task=>({taskId:task.id,destination:destinationFor(task.id),
    expectedUpdatedAt:task.updatedAt}));
  const movingNext=choices.some(item=>item.destination==="NEXT");
  const dropping=choices.filter(item=>item.destination==="DROP").length;
  const canSign=waiting.length===0&&!pending&&(!dropping||dropConfirmed);
  async function signOff(){
    if(!canSign)return;
    setPending(true);setError(null);
    try{
      await projectMutation(
        "/api/projects/"+encodeURIComponent(projectId)+
          "/sprints/"+encodeURIComponent(sprintId)+"/complete",
        "POST",{
          ...(note.trim()?{note:note.trim()}:{}),
          decisions:choices,
          ...(movingNext&&nextSprint?{nextSprintId:nextSprint.id}:{}),
        },
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
    setOpen(false);setPending(false);setNote("");setDropConfirmed(false);
    setDestinations({});
    showToast({tone:"success",title:nextSprint&&startNext?
      "Sprint signed off and next sprint started":"Sprint signed off",
      ...(unfinished.length?{description:
        choices.filter(item=>item.destination==="NEXT").length+" to next sprint, "+
        choices.filter(item=>item.destination==="BACKLOG").length+" to backlog, "+
        dropping+" archived."}:{}),});
    router.refresh();
  }
  return <>
    <Button size="sm" variant="secondary" type="button" onClick={()=>{
      setDestinations({});setDropConfirmed(false);setOpen(true);
    }}>
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
          <p>Choose where each unfinished task goes. All choices are saved with the sprint
            sign-off in one transaction.</p>
          <ul>{carried.map(task=><li key={task.id} className="prototype-mentor-carry-task">
            <span><strong>{task.title}</strong><small>{task.status.replaceAll("_"," ")}</small></span>
            <fieldset aria-label={"Where should "+task.title+" go?"}
              className="prototype-mentor-carry-choices">
              {([
                ...(nextSprint?[{destination:"NEXT" as const,label:nextSprint.title}]:[]),
                {destination:"BACKLOG" as const,label:"Backlog"},
                {destination:"DROP" as const,label:"Drop it"},
              ]).map(choice=><label key={choice.destination}
                className={destinationFor(task.id)===choice.destination?"is-selected":""}>
                <input type="radio" name={"carry-"+task.id}
                  checked={destinationFor(task.id)===choice.destination}
                  onChange={()=>{setDestinations(previous=>({
                    ...previous,[task.id]:choice.destination,
                  }));setDropConfirmed(false);}} disabled={pending}/>
                {choice.label}
              </label>)}
            </fieldset>
          </li>)}</ul>
          {dropping>0?<label className="prototype-mentor-signoff-next">
            <input type="checkbox" checked={dropConfirmed} disabled={pending}
              onChange={event=>setDropConfirmed(event.target.checked)}/>
            I understand that {dropping} dropped task{dropping===1?" is":"s are"} archived
            from the board, with their history retained.
          </label>:null}
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
            {waiting.length?"Approve tasks first":dropping&&!dropConfirmed?
              "Confirm dropped tasks":nextSprint&&startNext?
              "Sign off and start next sprint":"Sign off sprint"}
          </Button>
        </div>
      </div>
    </Dialog>
  </>;
}
