"use client";

import {useRouter} from "next/navigation";
import {useMemo,useState} from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {facultyLiveEditorCommand} from "@/modules/courses/faculty-live-editor-command";
import {facultyLiveSaveFeedback} from "@/modules/courses/faculty-live-save-feedback";
import {facultyLiveEditorDraft,emptyFacultyLiveDraft} from "@/modules/courses/faculty-live-editor-model";
import {facultyLiveSessionOption} from "@/modules/courses/faculty-live-session-option";
import {facultyLiveConfirmText} from "@/modules/courses/faculty-live-confirmation";
import {facultyLiveMutationSuccess} from "@/modules/courses/faculty-live-success";
import {FacultyIstQuarterHourPicker} from "@/components/courses/faculty-ist-quarter-hour-picker";
import {FACULTY_IST_NOTE,facultyIstQuarterHourIssue} from "@/modules/courses/faculty-ist-quarter-hour-model";

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
  const [confirmOpen,setConfirmOpen]=useState(false);
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
  async function save(confirmed=false){
    if(!deliveryId||pending||!ready)return;
    let payload:ReturnType<typeof facultyLiveEditorCommand>;
    try{payload=facultyLiveEditorCommand({
      action,lessonId,selected:chosen,title,meetingUrl,startsAt,endsAt,
    });}catch(caught){
      setError(caught instanceof Error?caught.message:"Invalid live-class details.");return;
    }
    if(action!=="CANCEL"){
      const timeIssue=facultyIstQuarterHourIssue(startsAt)||facultyIstQuarterHourIssue(endsAt);
      if(timeIssue){setError(timeIssue);return;}
    }
    if(!confirmed){setConfirmOpen(true);return;}
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
    finally{setPending(false);setConfirmOpen(false);}
  }
  return <section aria-label="Manage Faculty live classes"
    className="space-y-3">
    <h2 className="font-semibold text-foreground">Schedule or manage a live class</h2>
    <p className="text-xs text-muted-foreground">
      Enter meeting times in IST (Asia/Kolkata), regardless of your device time zone.
      Each confirmed write is scoped to your assigned Section. HTTPS links only.
    </p>
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-[13px] font-semibold">Action
        <Select value={action} onChange={e=>changeAction(e.target.value as typeof action)}
          className="text-base md:text-sm">
          <option value="CREATE">Schedule</option><option value="EDIT">Reschedule / edit</option>
          <option value="CANCEL">Cancel</option>
        </Select>
      </label>
      {action==="CREATE"?
        <label className="grid gap-1 text-[13px] font-semibold">Lesson
          <Select value={lessonId} onChange={e=>setLessonId(e.target.value)}
            className="text-base md:text-sm">
            {choices.map(x=><option key={x.id} value={x.id}>
              {x.title} · Section {x.deliveryId.slice(0,8)}
            </option>)}
          </Select>
        </label> :
        <label className="grid gap-1 text-[13px] font-semibold">Published session
          <Select value={selectedId} onChange={e=>preloadSession(e.target.value)}
            className="text-base md:text-sm">
            {sessions.map(x=><option key={x.id} value={x.id}>{facultyLiveSessionOption(x)}</option>)}
          </Select>
        </label>}
      {action!=="CANCEL"&&<>
        <label className="grid gap-1 text-[13px] font-semibold">Title
          <Input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}
            required className="text-base md:text-sm" />
        </label>
        <label className="grid gap-1 text-[13px] font-semibold">HTTPS meeting link
          <Input type="url" value={meetingUrl} onChange={e=>setMeetingUrl(e.target.value)}
            placeholder="https://..." required
            className="text-base md:text-sm" />
        </label>
        <FacultyIstQuarterHourPicker label="Start" value={startsAt} onChange={setStartsAt}/>
        <FacultyIstQuarterHourPicker label="End" value={endsAt} onChange={setEndsAt}/>
      </>}
    </div>
    {action!=="CANCEL"?<p className="text-xs text-body">
      {FACULTY_IST_NOTE} Choose 15-minute steps using the 12-hour AM/PM clock.
    </p>:null}
    {action!=="CANCEL"&&(startsAt&&facultyIstQuarterHourIssue(startsAt)||
      endsAt&&facultyIstQuarterHourIssue(endsAt))?
      <Alert tone="warning">Select quarter-hour start and end times before saving.</Alert>:null}
    {!ready?<p className="text-sm text-muted-foreground">
      {action==="CREATE"?"No registered lessons are available to schedule.":"No editable published session is available on this page."}
    </p>:null}
    <Button type="button" loading={pending} disabled={!ready||pending} onClick={()=>void save()} variant={action==="CANCEL"?"danger":"primary"}>
      {pending?"Saving…":"Confirm "+(action==="CREATE"?"schedule":action==="EDIT"?"edit":"cancel")}
    </Button>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
      title={facultyLiveConfirmText(action,chosen,choice?.title??"selected lesson")}
      confirmLabel={"Confirm "+(action==="CREATE"?"schedule":action==="EDIT"?"edit":"cancel")}
      confirmVariant={action==="CANCEL"?"danger":"primary"} pending={pending}
      onConfirm={()=>void save(true)} />
    {error?<Alert tone="error">{error}</Alert>:null}
    {success?<Alert tone="success">{success}</Alert>:null}
  </section>;
}
