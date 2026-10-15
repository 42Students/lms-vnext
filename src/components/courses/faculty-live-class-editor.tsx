"use client";

import {useRouter} from "next/navigation";
import {useMemo,useState} from "react";
import {facultyLiveEditorCommand} from "@/modules/courses/faculty-live-editor-command";
import {facultyLiveSaveFeedback} from "@/modules/courses/faculty-live-save-feedback";
import {facultyLiveEditorDraft,emptyFacultyLiveDraft} from "@/modules/courses/faculty-live-editor-model";
import {facultyLiveSessionOption} from "@/modules/courses/faculty-live-session-option";
import {facultyLiveConfirmText} from "@/modules/courses/faculty-live-confirmation";
import {facultyLiveMutationSuccess} from "@/modules/courses/faculty-live-success";

type Choice={id:string;title:string;deliveryId:string};
type Session={
  id:string;deliveryId:string;title:string;startsAt:string;endsAt:string;
  expectedUpdatedAt:string|null;meetingUrl:string|null;
  courseName:string;sectionName:string;
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
  const [success,setSuccess]=useState<string|null>(null);
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
    setError(null);setSuccess(null);
  }
  function changeAction(next:typeof action){
    setAction(next);
    if(next==="CREATE"){
      // Do not accidentally reuse another published meeting as a new draft.
      const clean=emptyFacultyLiveDraft();
      setTitle(clean.title);setMeetingUrl(clean.meetingUrl);
      setStartsAt(clean.startsAt);setEndsAt(clean.endsAt);
    }else if(chosen){
      preloadSession(chosen.id);
    }
    setError(null);setSuccess(null);
  }
  async function save(){
    if(!deliveryId||pending||!ready)return;
    let payload:ReturnType<typeof facultyLiveEditorCommand>;
    try{payload=facultyLiveEditorCommand({
      action,lessonId,selected:chosen,title,meetingUrl,startsAt,endsAt,
    });}catch(caught){
      setError(caught instanceof Error?caught.message:"Invalid live-class details.");return;
    }
    if(!window.confirm(facultyLiveConfirmText(action,chosen,choice?.title??"selected lesson")))return;
    setPending(true);setError(null);setSuccess(null);
    try{
      const result=await fetch(
        "/api/courses/faculty/live-classes/"+encodeURIComponent(deliveryId)+"/command",
        {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)},
      );
      if(!result.ok){
        const body=await result.json().catch(()=>({error:"UNKNOWN"})) as {error?:string};
        throw new Error(facultyLiveSaveFeedback(body.error));
      }
      // A second click must not accidentally submit the same CREATE again.
      const blank=emptyFacultyLiveDraft();
      setTitle(blank.title);setMeetingUrl(blank.meetingUrl);
      setStartsAt(blank.startsAt);setEndsAt(blank.endsAt);
      setAction("CREATE");
      setSuccess(facultyLiveMutationSuccess(action));
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
            {sessions.map(x=><option key={x.id} value={x.id}>{facultyLiveSessionOption(x)}</option>)}
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
    {success?<p role="status" className="text-sm font-semibold text-foreground">{success}</p>:null}
  </section>;
}
