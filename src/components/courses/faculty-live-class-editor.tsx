"use client";

import {useRouter} from "next/navigation";
import {useMemo,useState} from "react";
import {authoringDueInstant} from "@/modules/courses/faculty-authoring-datetime-model";
import {facultyLiveEditorDraft} from "@/modules/courses/faculty-live-editor-model";

type Choice={id:string;title:string;deliveryId:string};
type Session={
  id:string;deliveryId:string;title:string;startsAt:string;endsAt:string;
  expectedUpdatedAt:string|null;meetingUrl:string|null;
};
export function FacultyLiveClassEditor({
  choices,sessions,
}:{choices:readonly Choice[];sessions:readonly Session[]}) {
  const router=useRouter();
  const [action,setAction]=useState<"CREATE"|"EDIT"|"CANCEL">("CREATE");
  const [lessonId,setLessonId]=useState(choices[0]?.id??"");
  const [selectedId,setSelectedId]=useState(sessions[0]?.id??"");
  const [title,setTitle]=useState("");
  const [meetingUrl,setMeetingUrl]=useState("");
  const [startsAt,setStartsAt]=useState("");
  const [endsAt,setEndsAt]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const chosen=useMemo(()=>sessions.find(s=>s.id===selectedId),[sessions,selectedId]);
  const choice=choices.find(x=>x.id===lessonId);
  const deliveryId=action==="CREATE"?choice?.deliveryId:chosen?.deliveryId;
  const ready=Boolean(deliveryId && (action==="CREATE" ? lessonId :
    chosen?.expectedUpdatedAt));
  function preloadSession(id:string){
    setSelectedId(id);
    const found=sessions.find(item=>item.id===id);
    if(found){
      const draft=facultyLiveEditorDraft(found);
      setTitle(draft.title);setMeetingUrl(draft.meetingUrl);
      setStartsAt(draft.startsAt);setEndsAt(draft.endsAt);
    }
    setError(null);
  }
  function changeAction(next:typeof action){
    setAction(next);
    if(next!=="CREATE"&&chosen)preloadSession(chosen.id);
    setError(null);
  }
  async function save(){
    if(!deliveryId||pending||!ready)return;
    const verb=action==="CREATE"?"schedule":action==="EDIT"?"reschedule":"cancel";
    if(!window.confirm("Confirm: "+verb+" this Section live class?"))return;
    setPending(true);setError(null);
    try{
      const payload=action==="CANCEL" ?
        {action,contentId:chosen?.id,expectedUpdatedAt:chosen?.expectedUpdatedAt,confirm:true} :
        {
          action, ...(action==="CREATE"?{lessonId}:{contentId:chosen?.id,
            expectedUpdatedAt:chosen?.expectedUpdatedAt}),
          title,meetingUrl,
          startsAt:authoringDueInstant(startsAt),
          endsAt:authoringDueInstant(endsAt),confirm:true,
        };
      const result=await fetch(
        "/api/courses/faculty/live-classes/"+encodeURIComponent(deliveryId)+"/command",
        {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)},
      );
      if(!result.ok)throw new Error("The live-class change was not saved. Verify Section ownership, times and current version.");
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Unable to save live class.");}
    finally{setPending(false);}
  }
  return <section aria-label="Manage Faculty live classes"
    className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">Schedule or manage a live class</h2>
    <p className="text-xs text-muted-foreground">
      Enter meeting times in IST (Asia/Kolkata), regardless of your device time zone.
      Each confirmed write is scoped to your assigned Section. HTTPS links only.
    </p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Action
        <select value={action} onChange={e=>changeAction(e.target.value as typeof action)}
          className="min-h-10 rounded border border-border bg-background p-2">
          <option value="CREATE">Schedule</option><option value="EDIT">Reschedule / edit</option>
          <option value="CANCEL">Cancel</option>
        </select>
      </label>
      {action==="CREATE"?
        <label className="grid gap-1 text-sm">Lesson
          <select value={lessonId} onChange={e=>setLessonId(e.target.value)}
            className="min-h-10 rounded border border-border bg-background p-2">
            {choices.map(x=><option key={x.id} value={x.id}>
              {x.title} · Section {x.deliveryId.slice(0,8)}
            </option>)}
          </select>
        </label> :
        <label className="grid gap-1 text-sm">Published session
          <select value={selectedId} onChange={e=>preloadSession(e.target.value)}
            className="min-h-10 rounded border border-border bg-background p-2">
            {sessions.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}
          </select>
        </label>}
      {action!=="CANCEL"&&<>
        <label className="grid gap-1 text-sm">Title
          <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}
            required className="min-h-10 rounded border border-border bg-background p-2" />
        </label>
        <label className="grid gap-1 text-sm">HTTPS meeting link
          <input type="url" value={meetingUrl} onChange={e=>setMeetingUrl(e.target.value)}
            placeholder="https://..." required
            className="min-h-10 rounded border border-border bg-background p-2" />
        </label>
        <label className="grid gap-1 text-sm">Start
          <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}
            required className="min-h-10 rounded border border-border bg-background p-2" />
        </label>
        <label className="grid gap-1 text-sm">End
          <input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}
            required className="min-h-10 rounded border border-border bg-background p-2" />
        </label>
      </>}
    </div>
    {!ready?<p className="text-sm text-muted-foreground">
      {action==="CREATE"?"No registered lessons are available to schedule.":"No editable published session is available on this page."}
    </p>:null}
    <button type="button" disabled={!ready||pending} onClick={save}
      className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      {pending?"Saving…":"Confirm "+(action==="CREATE"?"schedule":action==="EDIT"?"edit":"cancel")}
    </button>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </section>;
}
