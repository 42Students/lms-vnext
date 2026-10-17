"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { mentorMeetingCeremonyLabel, mentorMeetingScheduleError } from "@/modules/projects/mentor-meeting-form-model";
import {emptyMentorMeetingFacilitation,mentorMeetingFacilitationSchema} from "@/modules/projects/mentor-meeting-facilitation-model";

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
    <div className="grid gap-4">
      <label>
        <span className="mb-1.5 block text-xs font-semibold text-body">
          {isRequest?"Title":"Title"}
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
        <span className="mb-1.5 block text-xs font-semibold text-body">
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
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            {isRequest?"Preferred start time":"Start"}
          </span>
          <Input
            type="datetime-local"
            required
            min={minStart}
            value={startsAt}
            onChange={(event) =>
              onStartsAt(event.target.value)
            }
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            {isRequest?"Preferred end time":"End"}
          </span>
          <Input
            type="datetime-local"
            required
            value={endsAt}
            onChange={(event) =>
              onEndsAt(event.target.value)
            }
          />
        </label>
      </div>
      <p className="text-xs font-semibold text-body">Times are in Asia/Kolkata (IST).</p>
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

  function openDialog() {
    setMinStart(toLocalInput(new Date()));
    setTimeZone(
      Intl.DateTimeFormat()
        .resolvedOptions().timeZone || "UTC",
    );
    setError(null);
    setOpen(true);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    if(startsAt && new Date(startsAt).getTime()<Date.now()){
      setError("Preferred date cannot be in the past.");
      return;
    }
    if (
      !startsAt ||
      !endsAt ||
      new Date(endsAt).getTime() <=
        new Date(startsAt).getTime()
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
        onClick={openDialog}
      >
        Request a meeting
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Request a meeting"
        description="Suggest a time window and agenda. A mentor or admin can turn the request into a scheduled meeting."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
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
          <fieldset className="grid gap-3 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Meeting notes and follow-up</legend>
            {([
              ["notes","Notes"],["actionItems","Action items"],
              ["wentWell","What went well?"],["improve","What could improve?"],
              ["nextTime","What to try next?"],["followUpNotes","Follow-up notes"],
            ] as const).map(([field,label])=>
              <label key={field} className="grid gap-1 text-xs font-semibold text-body">
                {label}
                <Textarea value={facilitation[field]} maxLength={4000}
                  onChange={event=>setFacilitation(prev=>({...prev,[field]:event.target.value}))}/>
              </label>)}
            <label className="grid gap-1 text-xs font-semibold text-body">
              Outcome
              <Textarea value={outcome} maxLength={4000} onChange={event=>setOutcome(event.target.value)}/>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-body">
              Follow-up at (IST)
              <Input type="datetime-local" value={followUpAt}
                onChange={event=>setFollowUpAt(event.target.value)}/>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-body">
              Follow-up status
              <Select value={facilitation.followUpStatus}
                onChange={event=>setFacilitation(prev=>({...prev,
                  followUpStatus:event.target.value as "NOT_PLANNED"|"OPEN"|"DONE"}))}>
                <option value="NOT_PLANNED">Not planned</option>
                <option value="OPEN">Open</option>
                <option value="DONE">Done</option>
              </Select>
            </label>
          </fieldset>
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
    sprintId: string;
  })[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(
    meeting?.title ?? "",
  );
  const [agenda, setAgenda] = useState(
    meeting?.agenda ?? "",
  );
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

  function openDialog() {
    setScheduleMinStart(toLocalInput(new Date(Date.now() + 60_000)));
    setTitle(meeting?.title ?? "");
    setAgenda(meeting?.agenda ?? "");
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
    setMeetingUrl(
      meeting?.meetingUrl ?? "",
    );
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

    const validationError = mentorMeetingScheduleError({
      title,
      startsAt,
      endsAt,
      meetingUrl,
      nowMs: Date.now(),
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (linkedTaskId && linkedSprintId) {
      const task = tasks.find(
        (item) => item.id === linkedTaskId,
      );
      if (
        task &&
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
          agenda: agenda.trim() || undefined,
          startsAt: toIso(startsAt),
          endsAt: toIso(endsAt),
          timeZone,
          meetingUrl: meetingUrl.trim(),
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
        title: meeting
          ? "Meeting scheduled"
          : "Meeting added.",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not schedule the meeting.",
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
        onClick={openDialog}
      >
        {meeting
          ? meeting.status === "REQUESTED"
            ? "Schedule request"
            : "Reschedule"
          : "Schedule meeting"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={
          meeting
            ? "Schedule Project meeting"
            : "New Project meeting"
        }
        description="Use an HTTP or HTTPS meeting link. Sprint and task links are checked against this Project."
      >
        <form
          noValidate
          onSubmit={submit}
          className="grid gap-4"
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
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Meeting link
            </span>
            <Input
              type="url"
              required
              value={meetingUrl}
              maxLength={2048}
              placeholder="https://… or http://…"
              onChange={(event) =>
                setMeetingUrl(
                  event.target.value,
                )
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-body">
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
              <span className="mb-1.5 block text-xs font-semibold text-body">
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
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
            >
              {pending
                ? "Saving…"
                : "Schedule meeting"}
            </Button>
          </div>
        </form>
      </Dialog>
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
    meeting.status === "SCHEDULED";
  const mayCancel =
    (manager &&
      (meeting.status === "REQUESTED" ||
        meeting.status === "SCHEDULED")) ||
    learnerOwnRequest;
  const withdrawing=learnerOwnRequest&&!manager;

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
        action === "COMPLETE"
          ? {
              action,
              ...(mode==="MENTOR"?{expectedUpdatedAt:new Date(meeting.updatedAt).toISOString(),confirmed:true}:{}),
              outcome:
                note.trim() || undefined,
            }
          : {
              action,
              ...(mode==="MENTOR"?{expectedUpdatedAt:new Date(meeting.updatedAt).toISOString(),confirmed:true}:{}),
              note:
                note.trim() || undefined,
            },
      );
      setOpen(null);
      setNote("");
      showToast({
        tone: "success",
        title:
          action === "COMPLETE"
            ? "Meeting completed"
            : withdrawing?"Meeting request withdrawn.":"Meeting cancelled",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Meeting update failed",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
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
            {withdrawing?"Withdraw":"Cancel meeting"}
          </Button>
        ) : null}
      </div>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpen(null);
        }}
        title={
          open === "COMPLETE"
            ? "Complete meeting"
            : withdrawing?"Withdraw this meeting request?":"Cancel meeting"
        }
        description={
          open === "COMPLETE"
            ? "Capture the outcome before closing this Project meeting."
            : withdrawing?"Your mentor will no longer see this request.":"Cancellation keeps the meeting record and its history visible."
        }
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(null)}
            >
              Back
            </Button>
            <Button
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
                  : withdrawing?"Withdraw request":"Cancel meeting"}
            </Button>
          </>
        }
      >
        {!withdrawing?<label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
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
    </>
  );
}
