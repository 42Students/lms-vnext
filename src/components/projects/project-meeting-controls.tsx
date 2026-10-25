"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { mentorMeetingCeremonyLabel, mentorMeetingScheduleError, parseMentorMeetingVenueAgenda } from "@/modules/projects/mentor-meeting-form-model";
import {emptyMentorMeetingFacilitation,mentorMeetingFacilitationSchema} from "@/modules/projects/mentor-meeting-facilitation-model";
import {projectMeetingTransitionPayload} from "@/modules/projects/project-meeting-transition-payload-model";

type Meeting = {
  id: string;
  status: string;
  meetingType: string;
  title: string;
  agenda: string | null;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  meetingUrl: string | null;
  outcome:string|null;
  facilitation:unknown;
  requestedByMembershipId: string | null;
  updatedAt: Date;
  linkedSprintId: string | null;
  linkedTaskId: string | null;
};

type LinkChoice = {
  id: string;
  label: string;
};

function toLocalInput(value: Date | null) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "";
  // datetime-local fields always show college IST, regardless of browser zone.
  return new Date(new Date(value).getTime()+330*60_000).toISOString().slice(0,16);
}

function toIso(value: string) {
  // HTML datetime-local values have no zone; interpret them as IST.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw Error("Enter a valid IST meeting date and time.");
  return new Date(value+":00+05:30").toISOString();
}

function MeetingFields({
  isRequest=false,
  minStart,
  title,
  agenda,
  startsAt,
  endsAt,
  onTitle,
  onAgenda,
  onStartsAt,
  onEndsAt,
}: {
  isRequest?:boolean;
  minStart?:string;
  title: string;
  agenda: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  onTitle: (value: string) => void;
  onAgenda: (value: string) => void;
  onStartsAt: (value: string) => void;
  onEndsAt: (value: string) => void;
  onTimeZone: (value: string) => void;
}) {
  return (
    <div className="grid min-w-0 gap-[var(--lms-space-4)]">
      <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Title
        </span>
        <Input
          required
          maxLength={200}
          value={title}
          onChange={(event) =>
            onTitle(event.target.value)
          }
        />
      </label>
      <label>
        <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {isRequest?"Agenda / reason":"Agenda"}
        </span>
        <Textarea
          value={agenda}
          maxLength={4000}
          onChange={(event) =>
            onAgenda(event.target.value)
          }
        />
      </label>
      <div className="grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-2">
        <label>
          <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {isRequest?"Preferred start time":"Start"}
          </span>
          <Input
            type="date"
            required
            min={minStart?.slice(0, 10)}
            aria-label={isRequest ? "Preferred start date" : "Start date"}
            value={startsAt.slice(0, 10)}
            onChange={(event) => onStartsAt(event.target.value
              ? event.target.value + "T" + (startsAt.slice(11) || "09:00") : "")}
          />
          <Input type="time" required step={300}
            aria-label={isRequest ? "Preferred start time" : "Start time"}
            value={startsAt.slice(11)} disabled={!startsAt.slice(0, 10)}
            onChange={(event) => onStartsAt(startsAt.slice(0, 10) + "T" + event.target.value)}
          />
        </label>
        <label>
          <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {isRequest?"Preferred end time":"End"}
          </span>
          <Input
            type="date"
            required
            aria-label={isRequest ? "Preferred end date" : "End date"}
            value={endsAt.slice(0, 10)}
            onChange={(event) => onEndsAt(event.target.value
              ? event.target.value + "T" + (endsAt.slice(11) || "10:00") : "")}
          />
          <Input type="time" required step={300}
            aria-label={isRequest ? "Preferred end time" : "End time"}
            value={endsAt.slice(11)} disabled={!endsAt.slice(0, 10)}
            onChange={(event) => onEndsAt(endsAt.slice(0, 10) + "T" + event.target.value)}
          />
        </label>
      </div>
      <p className="text-xs font-semibold text-body">Times are in Asia/Kolkata (IST). Choose times in five-minute increments.</p>
    </div>
  );
}

export function RequestProjectMeetingControl({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [timeZone, setTimeZone] =
    useState("Asia/Kolkata");
  const [minStart,setMinStart]=useState("");
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const dirty=Boolean(title||agenda||startsAt||endsAt);
  function discardDraft(){setOpen(false);setTitle("");setAgenda("");setStartsAt("");setEndsAt("");setError(null);}
  const guard=useProjectEditorDiscardGuard(open,dirty,pending,discardDraft);
  function openDialog() {
    setMinStart(toLocalInput(new Date()));
    setTimeZone("Asia/Kolkata");
    setError(null);
    setOpen(true);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    if(startsAt && Date.parse(startsAt + ":00+05:30") < Date.now()){
      setError("Preferred date cannot be in the past.");
      return;
    }
    if (
      !startsAt ||
      !endsAt ||
      Date.parse(endsAt + ":00+05:30") <=
        Date.parse(startsAt + ":00+05:30")
    ) {
      setError(
        "End time must be after the start time.",
      );
      return;
    }

    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/meetings/request`,
        "POST",
        {
          title: title.trim(),
          agenda: agenda.trim() || undefined,
          startsAt: toIso(startsAt),
          endsAt: toIso(endsAt),
          timeZone,
        },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: "Meeting request sent to your mentor.",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not request the meeting.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        aria-haspopup="dialog" aria-expanded={open}
        onClick={openDialog}
      >
        Request a meeting
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
        title="Request a meeting"
        description="Suggest a time window and agenda. A mentor or admin can turn the request into a scheduled meeting."
      >
        <form
          onSubmit={submit}
          className="grid min-w-0 gap-[var(--lms-space-4)]"
        >
          <MeetingFields
            isRequest
            minStart={minStart}
            title={title}
            agenda={agenda}
            startsAt={startsAt}
            endsAt={endsAt}
            timeZone={timeZone}
            onTitle={setTitle}
            onAgenda={setAgenda}
            onStartsAt={setStartsAt}
            onEndsAt={setEndsAt}
            onTimeZone={setTimeZone}
          />

          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={guard.requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={pending}
              disabled={
                pending ||
                !title.trim() ||
                !startsAt ||
                !endsAt ||
                !timeZone.trim()
              }
            >
              {pending
                ? "Requesting…"
                : "Send request"}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
        title="Discard meeting request?" description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
    </>
  );
}

export function ScheduleProjectMeetingControl({
  projectId,
  projectUpdatedAt,
  meeting,
  sprints,
  tasks,
}: {
  projectId: string;
  projectUpdatedAt: Date | string;
  meeting?: Meeting | null;
  sprints: readonly LinkChoice[];
  tasks: readonly (LinkChoice & {
    sprintId: string | null;
  })[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(
    meeting?.title ?? "",
  );
  const [agenda, setAgenda] = useState(
    parseMentorMeetingVenueAgenda(meeting?.agenda).agenda,
  );
  const [location,setLocation]=useState(()=>parseMentorMeetingVenueAgenda(meeting?.agenda).location);
  const [startsAt, setStartsAt] = useState(
    meeting
      ? toLocalInput(meeting.startsAt)
      : "",
  );
  const [endsAt, setEndsAt] = useState(
    meeting
      ? toLocalInput(meeting.endsAt)
      : "",
  );
  const [timeZone, setTimeZone] =
    useState("Asia/Kolkata");
  const [meetingUrl, setMeetingUrl] =
    useState(meeting?.meetingUrl ?? "");
  const [scheduleMinStart, setScheduleMinStart] = useState("");
  const [meetingStatus,setMeetingStatus]=useState<"DRAFT"|"SCHEDULED"|"RESCHEDULED">(
    meeting?.status==="DRAFT"?"DRAFT":meeting?.status==="RESCHEDULED"?"RESCHEDULED":"SCHEDULED");
  const [facilitation,setFacilitation]=useState(()=>
    mentorMeetingFacilitationSchema.parse(meeting?.facilitation??emptyMentorMeetingFacilitation));
  const [outcome,setOutcome]=useState(meeting?.outcome??"");
  const [followUpAt,setFollowUpAt]=useState(()=>
    facilitation.followUpAt?toLocalInput(new Date(facilitation.followUpAt)):"");

  const [meetingType, setMeetingType] =
    useState(meeting?.meetingType ?? "GENERAL");
  const [linkedSprintId, setLinkedSprintId] =
    useState(meeting?.linkedSprintId ?? "");
  const [linkedTaskId, setLinkedTaskId] =
    useState(meeting?.linkedTaskId ?? "");
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const initialFacilitation=mentorMeetingFacilitationSchema.parse(meeting?.facilitation??emptyMentorMeetingFacilitation);
  const dirty=title!==(meeting?.title??"")||
    agenda!==parseMentorMeetingVenueAgenda(meeting?.agenda).agenda||
    location!==parseMentorMeetingVenueAgenda(meeting?.agenda).location||
    startsAt!==(meeting?toLocalInput(meeting.startsAt):"")||
    endsAt!==(meeting?toLocalInput(meeting.endsAt):"")||
    meetingUrl!==(meeting?.meetingUrl??"")||
    meetingType!==(meeting?.meetingType??"GENERAL")||
    linkedSprintId!==(meeting?.linkedSprintId??"")||
    linkedTaskId!==(meeting?.linkedTaskId??"")||
    outcome!==(meeting?.outcome??"")||
    JSON.stringify(facilitation)!==JSON.stringify(initialFacilitation)||
    followUpAt!==(initialFacilitation.followUpAt?toLocalInput(new Date(initialFacilitation.followUpAt)):"")||
    meetingStatus!==(meeting?.status==="DRAFT"?"DRAFT":meeting?.status==="RESCHEDULED"?"RESCHEDULED":"SCHEDULED");
  function discardDraft(){setOpen(false);setError(null);}
  const guard=useProjectEditorDiscardGuard(open,dirty,pending,discardDraft);
  function openDialog() {
    setScheduleMinStart(toLocalInput(new Date(Date.now() + 60_000)));
    setTitle(meeting?.title ?? "");
    setAgenda(parseMentorMeetingVenueAgenda(meeting?.agenda).agenda);
    setLocation(parseMentorMeetingVenueAgenda(meeting?.agenda).location);
    setStartsAt(
      meeting
        ? toLocalInput(meeting.startsAt)
        : "",
    );
    setEndsAt(
      meeting
        ? toLocalInput(meeting.endsAt)
        : "",
    );
    setTimeZone("Asia/Kolkata");
    setMeetingUrl(meeting?.meetingUrl ?? "");
    setMeetingStatus(
      meeting?.status==="DRAFT"?"DRAFT":meeting?.status==="RESCHEDULED"?"RESCHEDULED":"SCHEDULED");
    setMeetingType(
      meeting?.meetingType ?? "GENERAL",
    );
    const stored=mentorMeetingFacilitationSchema.parse(meeting?.facilitation??{});
    setFacilitation(stored);
    setOutcome(meeting?.outcome??"");
    setFollowUpAt(stored.followUpAt?toLocalInput(new Date(stored.followUpAt)):"");

    setLinkedSprintId(
      meeting?.linkedSprintId ?? "",
    );
    setLinkedTaskId(
      meeting?.linkedTaskId ?? "",
    );
    setError(null);
    setOpen(true);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if(meeting&&!dirty){
      showToast({tone:"info",title:"No changes to save"});
      return;
    }
    const validationError = mentorMeetingScheduleError({
      title,
      startsAt,
      endsAt,
      meetingUrl,
      location,
      draft:meetingStatus==="DRAFT",
      nowMs: Date.now(),
    });
    if (validationError) {
      // The schedule editor is one row of the legacy repeatable editor.
      // Keep its row index in validation instead of a generic dialog error.
      setError("Item 1 required fields: "+validationError);
      return;
    }
    if(meetingType==="RETRO"&&!facilitation.notes.trim()&&!facilitation.wentWell.trim()&&!facilitation.retroDidntGoWell.trim()&&!facilitation.improve.trim()&&!facilitation.retroActions.length){
      setError("Item 1 required fields: Add retrospective notes or reflections.");
      return;
    }

    if (linkedTaskId && linkedSprintId) {
      const task = tasks.find(
        (item) => item.id === linkedTaskId,
      );
      if (
        task && linkedSprintId &&
        task.sprintId !== linkedSprintId
      ) {
        setError(
          "The linked task must belong to the linked sprint.",
        );
        return;
      }
    }

    setPending(true);
    try {
      await projectMutation(
        meeting
          ? `/api/projects/${projectId}/meetings/${meeting.id}`
          : `/api/projects/${projectId}/meetings`,
        meeting ? "PATCH" : "POST",
        {
          title: title.trim(),
          // An explicit null clears a removed venue; omission would retain old agenda.
          agenda: agenda.trim() || null,
          ...(location.trim()?{location:location.trim()}:{}),
          startsAt: toIso(startsAt),
          endsAt: toIso(endsAt),
          timeZone,
          status:meetingStatus,
          meetingUrl:meetingStatus==="DRAFT"?null:meetingUrl.trim()||null,
          expectedProjectUpdatedAt: new Date(projectUpdatedAt).toISOString(),
          ...(meeting?{expectedUpdatedAt:new Date(meeting.updatedAt).toISOString()}:{}),
          meetingType,
          outcome:outcome.trim()||null,
          facilitation:{
            ...facilitation,
            followUpAt:followUpAt?toIso(followUpAt):null,
          },
          linkedSprintId:
            linkedSprintId || undefined,
          linkedTaskId:
            linkedTaskId || undefined,
        },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title:"Meetings updated",
      });
      router.refresh();
    } catch(reason) {
      // Never surface provider/DB exception text; the draft remains editable.
      setError("Could not schedule this meeting. Review its latest details and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        aria-haspopup="dialog" aria-expanded={open}
        onClick={openDialog}
      >
        {meeting
          ? meeting.status === "REQUESTED"
            ? "Schedule request"
            : "Reschedule"
          : "Add meeting"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
        title={
          meeting
            ? "Schedule Project meeting"
            : "New Project meeting"
        }
        description="Add meeting details, then Save meeting plan. Drafts stay private. Scheduling accepts a web link or physical venue; final outcomes use the separate Complete or Cancel actions."
      >
        <form
          noValidate
          onSubmit={submit}
          className="grid min-w-0 gap-[var(--lms-space-4)]"
        >
          <MeetingFields
            title={title}
            agenda={agenda}
            startsAt={startsAt}
            endsAt={endsAt}
            timeZone={timeZone}
            minStart={scheduleMinStart}
            onTitle={setTitle}
            onAgenda={setAgenda}
            onStartsAt={setStartsAt}
            onEndsAt={setEndsAt}
            onTimeZone={setTimeZone}
          />
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Status
            <Select value={meetingStatus} onChange={event=>
              setMeetingStatus(event.target.value as "DRAFT"|"SCHEDULED"|"RESCHEDULED")}>
              <option value="REQUESTED" disabled>Requested (learner request)</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RESCHEDULED" disabled={!meeting||meeting.status==="DRAFT"||meeting.status==="REQUESTED"}>Rescheduled</option>
              <option value="COMPLETED" disabled>Completed (use Complete control)</option>
              <option value="CANCELLED" disabled>Cancelled (use Cancel control)</option>
              {(!meeting||meeting.status==="DRAFT")?<option value="DRAFT">Draft</option>:null}
            </Select>
            {meetingStatus==="DRAFT"?<span className="text-xs text-muted-foreground">
              Drafts are visible to mentors only; no invitations are sent.
            </span>:null}
          </label>
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Ceremony
            </span>
            <Select
              value={meetingType}
              onChange={(event) =>
                setMeetingType(
                  event.target.value,
                )
              }
            >
              {[
                "GENERAL",
                "PLANNING",
                "STANDUP",
                "REVIEW",
                "RETRO",
              ].map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {mentorMeetingCeremonyLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Meeting link
            </span>
            <Input
              type="url"
              required={meetingStatus!=="DRAFT"&&!location.trim()}
              value={meetingUrl}
              maxLength={500}
              placeholder="https://… or http://…"
              onChange={(event) =>
                setMeetingUrl(
                  event.target.value,
                )
              }
            />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Physical venue (or use a meeting link)
            <Input type="text" value={location} maxLength={200}
              placeholder="Lab 2, Room 304" onChange={event=>setLocation(event.target.value)}/>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                Linked sprint
              </span>
              <Select
                value={linkedSprintId}
                onChange={(event) =>
                  setLinkedSprintId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  No sprint
                </option>
                {sprints.map((sprint) => (
                  <option
                    key={sprint.id}
                    value={sprint.id}
                  >
                    {sprint.label}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                Linked task
              </span>
              <Select
                value={linkedTaskId}
                onChange={(event) =>
                  setLinkedTaskId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  No task
                </option>
                {tasks
                  .filter(
                    (task) =>
                      !linkedSprintId ||
                      task.sprintId ===
                        linkedSprintId,
                  )
                  .map((task) => (
                    <option
                      key={task.id}
                      value={task.id}
                    >
                      {task.label}
                    </option>
                  ))}
              </Select>
            </label>
          </div>
          <details open className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold leading-4 text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Meeting notes, retrospective and follow-ups</summary>
            <fieldset className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)]">
            {([
              ["notes","Notes"],["actionItems","Follow-up actions"],
              ["wentWell","Retrospective: What went well?"],["retroDidntGoWell","Retrospective: What didn't go well?"],["improve","Retrospective: What could improve?"],
              ["nextTime","Retrospective: Actions for next sprint"],["followUpNotes","Follow-up notes"],
            ] as const).filter(([field])=>meetingType==="RETRO" ||
              !["wentWell","retroDidntGoWell","improve","nextTime"].includes(field)).map(([field,label])=>
              <label key={field} className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                {label}
                <Textarea value={facilitation[field]} maxLength={4000}
                  onChange={event=>setFacilitation(prev=>({...prev,[field]:event.target.value}))}/>
              </label>)}
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Attendees (one name per line)
              <Textarea rows={3} maxLength={16000}
                value={facilitation.attendees.map(item=>item.name).join("\n")}
                onChange={event=>{
                 const names=event.target.value.split(/\r?\n/).map(line=>line.trim())
                  .filter(Boolean).slice(0,100);
                 setFacilitation(prev=>({...prev,attendees:names.map(name=>
                  prev.attendees.find(item=>item.name===name)??{name,membershipId:null,attended:true})}));
                }}/>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Action items (one per line)
              <Textarea rows={3} maxLength={40000}
                value={facilitation.actionItemRows.map(item=>item.text).join("\n")}
                onChange={event=>{
                 const values=event.target.value.split(/\r?\n/).map(line=>line.trim())
                  .filter(Boolean).slice(0,100);
                 setFacilitation(prev=>({...prev,actionItemRows:values.map(text=>
                  prev.actionItemRows.find(item=>item.text===text)??
                  {text,owner:null,dueAt:null,complete:false})}));
                }}/>
            </label>
            {meetingType==="RETRO"?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Retrospective actions (one per line)
              <Textarea rows={3} maxLength={40000}
                value={facilitation.retroActions.map(item=>item.text).join("\n")}
                onChange={event=>{
                 const actions=event.target.value.split(/\r?\n/).map(line=>line.trim())
                  .filter(Boolean).slice(0,100);
                 setFacilitation(prev=>({...prev,retroActions:actions.map(text=>
                  prev.retroActions.find(item=>item.text===text)??
                  {text,owner:null,dueAt:null,complete:false})}));
                }}/>
            </label>:null}
            {meetingType==="RETRO"&&facilitation.retroActions.length>0?
              <div className="min-w-0 space-y-2" aria-label="Linked retrospective action tasks">
                <p className="text-xs font-semibold text-body">Link retrospective actions to project tasks</p>
                {facilitation.retroActions.map((item,index)=><label key={index}
                  className="grid min-w-0 gap-1 text-xs text-body">
                  <span className="break-words">{item.text}</span>
                  <Select value={item.linkedTaskId??""}
                    onChange={event=>setFacilitation(prev=>({
                      ...prev,
                      retroActions:prev.retroActions.map((action,rowIndex)=>rowIndex===index
                        ?{...action,linkedTaskId:event.target.value||null}
                        :action),
                    }))}>
                    <option value="">Not linked to a task</option>
                    {tasks.map(task=><option key={task.id} value={task.id}>{task.label}</option>)}
                  </Select>
                  {item.taskKey?<span className="text-muted-foreground">
                    Legacy promoted task: {item.taskKey} (verify its mapped task before linking)
                  </span>:null}
                </label>)}
              </div>:null}
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Outcome
              <Textarea value={outcome} maxLength={4000} onChange={event=>setOutcome(event.target.value)}/>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Follow-up at (IST)
              <Input type="datetime-local" value={followUpAt}
                onChange={event=>setFollowUpAt(event.target.value)}/>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Follow-up status
              <Select value={facilitation.followUpStatus}
                onChange={event=>setFacilitation(prev=>({...prev,
                  followUpStatus:event.target.value as "NOT_PLANNED"|"OPEN"|"IN_PROGRESS"|"DONE"|"BLOCKED"}))}>
                <option value="NOT_PLANNED">Not planned</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </Select>
            </label>
            </fieldset>
          </details>
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={guard.requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={pending}
              disabled={pending || (Boolean(meeting) && !dirty)}
            >
              {pending
                ? "Saving…"
                : "Save meeting plan"}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
        title="Discard meeting changes?" description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
    </>
  );
}

export function ProjectMeetingTransitionActions({
  projectId,
  meeting,
  mode,
  currentMembershipId,
}: {
  projectId: string;
  meeting: Meeting;
  mode: "LEARNER" | "MENTOR" | "ADMIN";
  currentMembershipId: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState<
    "COMPLETE" | "CANCEL" | null
  >(null);
  const [note, setNote] = useState("");
  const [pending, setPending] =
    useState(false);
  function discardNote(){setOpen(null);setNote("");}
  const guard=useProjectEditorDiscardGuard(open!==null,Boolean(note.trim()),pending,discardNote);
  const manager =
    mode === "MENTOR" || mode === "ADMIN";
  const learnerOwnRequest =
    mode === "LEARNER" &&
    meeting.status === "REQUESTED" &&
    meeting.requestedByMembershipId ===
      currentMembershipId;

  if (
    !manager &&
    !learnerOwnRequest
  ) {
    return null;
  }

  const mayComplete =
    manager &&
    (meeting.status === "SCHEDULED" || meeting.status === "RESCHEDULED");
  const mayCancel =
    (manager &&
      (meeting.status === "DRAFT" || meeting.status === "REQUESTED" ||
        meeting.status === "SCHEDULED" || meeting.status === "RESCHEDULED")) ||
    learnerOwnRequest;
  const withdrawing=learnerOwnRequest&&!manager;
  const draftDiscard=manager&&meeting.status==="DRAFT";

  if (!mayComplete && !mayCancel) {
    return null;
  }

  async function transition(
    action: "COMPLETE" | "CANCEL",
  ) {
    setPending(true);
    try {
      await projectMutation(
        mode === "MENTOR" ? `/api/projects/${projectId}/meetings/${meeting.id}/mentor-decision` : `/api/projects/${projectId}/meetings/${meeting.id}/transition`,
        "POST",
        projectMeetingTransitionPayload(action,mode,meeting.updatedAt,note),
      );
      setOpen(null);
      setNote("");
      showToast({
        tone: "success",
        title:
          action === "COMPLETE"
            ? "Meeting completed"
            : withdrawing?"Meeting request withdrawn.":draftDiscard?"Meeting draft discarded.":"Meeting cancelled",
      });
      router.refresh();
    } catch {
      showToast({
        tone: "error",
        title: "Meeting update failed",
        description: "Review the meeting status and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row">
        {mayComplete ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setOpen("COMPLETE")
            }
          >
            Complete
          </Button>
        ) : null}
        {mayCancel ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setOpen("CANCEL")
            }
          >
            {withdrawing?"Withdraw":draftDiscard?"Discard draft":"Cancel meeting"}
          </Button>
        ) : null}
      </div>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) guard.requestClose();
        }}
        title={
          open === "COMPLETE"
            ? "Complete meeting"
            : withdrawing?"Withdraw this meeting request?":draftDiscard?"Discard meeting draft?":"Cancel meeting"
        }
        description={
          open === "COMPLETE"
            ? "Capture the outcome before closing this Project meeting."
            : withdrawing?"Your mentor will no longer see this request.":draftDiscard?"This draft was never shared with learners. Discarding keeps an internal record only.":"Cancellation keeps the meeting record and its history visible."
        }
        footer={
          <div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={guard.requestClose}
            >
              Back
            </Button>
            <Button
              className="w-full sm:w-auto"
              loading={pending}
              variant={
                open === "CANCEL"
                  ? "danger"
                  : "primary"
              }
              disabled={pending || open === null}
              onClick={() => {
                if (open) {
                  void transition(open);
                }
              }}
            >
              {pending
                ? "Saving…"
                : open === "COMPLETE"
                  ? "Complete"
                  : withdrawing?"Withdraw request":draftDiscard?"Discard draft":"Cancel meeting"}
            </Button>
          </div>
        }
      >
        {!withdrawing?<label>
          <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {open === "COMPLETE"
              ? "Outcome"
              : "Cancellation note"}
          </span>
          <Textarea
            value={note}
            maxLength={
              open === "COMPLETE"
                ? 4000
                : 2000
            }
            onChange={(event) =>
              setNote(event.target.value)
            }
          />
        </label>:null}
      </Dialog>
      <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
        title="Discard meeting note?" description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
    </>
  );
}
