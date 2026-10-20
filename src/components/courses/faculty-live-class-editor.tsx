"use client";

import {useRouter} from "next/navigation";
import {useMemo,useState} from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Disclosure } from "@/components/ui/disclosure";
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
  return (
    <section aria-label="Manage Faculty live classes" aria-busy={pending}
      className="min-w-0 max-w-4xl space-y-[var(--lms-space-4)]">
      <div className="min-w-0">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Schedule or manage a live class
        </h2>
        <p className="mt-1 max-w-prose text-xs leading-5 text-muted-foreground">
          Enter meeting times in IST (Asia/Kolkata), regardless of your device time zone.
          Each confirmed write is scoped to your assigned Section. HTTPS links only.
        </p>
      </div>
      <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
          Action
          <Select value={action} disabled={pending}
            onChange={event => changeAction(event.target.value as typeof action)}>
            <option value="CREATE">Schedule</option>
            <option value="EDIT">Reschedule / edit</option>
            <option value="CANCEL">Cancel</option>
          </Select>
        </label>
        {action === "CREATE" ? (
          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
            Lesson
            <Select value={lessonId} disabled={pending || !choices.length}
              onChange={event => { setLessonId(event.target.value); setError(null); }}>
              {!choices.length ? <option value="">No lessons available</option> : null}
              {choices.map(item => <option key={item.id} value={item.id}>
                {item.title} · Section {item.deliveryId.slice(0, 8)}
              </option>)}
            </Select>
          </label>
        ) : (
          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
            Published session
            <Select value={selectedId} disabled={pending || !sessions.length}
              onChange={event => preloadSession(event.target.value)}>
              {!sessions.length ? <option value="">No published sessions</option> : null}
              {sessions.map(item => <option key={item.id} value={item.id}>
                {facultyLiveSessionOption(item)}
              </option>)}
            </Select>
          </label>
        )}
        {action !== "CANCEL" ? (
          <>
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
              Title
              <Input value={title} maxLength={160} required disabled={pending}
                onChange={event => { setTitle(event.target.value); setError(null); }} />
            </label>
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-5 text-body">
              HTTPS meeting link
              <Input type="url" value={meetingUrl} required disabled={pending}
                placeholder="https://..."
                error={Boolean(meetingUrl && !/^https:\/\//i.test(meetingUrl.trim()))}
                onChange={event => { setMeetingUrl(event.target.value); setError(null); }} />
            </label>
            <div className="min-w-0 md:col-span-2">
              <div className="grid min-w-0 gap-[var(--lms-space-4)]">
                <FacultyIstQuarterHourPicker label="Start" value={startsAt}
                  disabled={pending} onChange={value => { setStartsAt(value); setError(null); }} />
                <FacultyIstQuarterHourPicker label="End" value={endsAt}
                  disabled={pending} onChange={value => { setEndsAt(value); setError(null); }} />
              </div>
              <p className="mt-2 max-w-prose text-xs leading-5 text-body">
                {FACULTY_IST_NOTE} Choose 15-minute steps using the 12-hour AM/PM clock.
              </p>
            </div>
          </>
        ) : null}
      </div>
      {action !== "CANCEL" &&
        ((startsAt && facultyIstQuarterHourIssue(startsAt)) ||
          (endsAt && facultyIstQuarterHourIssue(endsAt))) ? (
        <Alert tone="warning">Select quarter-hour start and end times before saving.</Alert>
      ) : null}
      {!ready ? (
        <Alert tone="warning">
          {action === "CREATE"
            ? "No registered lessons are available to schedule."
            : "No editable published session is available on this page."}
        </Alert>
      ) : null}
      {error ? <div role="alert"><Alert tone="error">{error}</Alert></div> : null}
      {success ? <div role="status"><Alert tone="success">{success}</Alert></div> : null}
      <div className="flex min-w-0 flex-col border-t border-border pt-[var(--lms-space-4)] sm:flex-row sm:justify-end">
        <Button type="button" loading={pending} disabled={!ready || pending}
          className="w-full sm:w-auto"
          onClick={() => void save()}
          variant={action === "CANCEL" ? "danger" : "primary"}>
          {pending ? "Saving…" : "Confirm " + (action === "CREATE" ? "schedule" : action === "EDIT" ? "edit" : "cancel")}
        </Button>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title={facultyLiveConfirmText(action, chosen, choice?.title ?? "selected lesson")}
        description={action === "CANCEL"
          ? "This will cancel the selected published session."
          : (title.trim() || "Live class") + " · " + startsAt + " – " + endsAt + " IST"}
        confirmLabel={"Confirm " + (action === "CREATE" ? "schedule" : action === "EDIT" ? "edit" : "cancel")}
        confirmVariant={action === "CANCEL" ? "danger" : "primary"} pending={pending}
        onConfirm={() => void save(true)} />
    </section>
  );
}
