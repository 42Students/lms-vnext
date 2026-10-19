"use client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type ResultOutcome =
  | "PASS"
  | "FAIL"
  | "HOLD"
  | "ABSENT";

type RecruiterRound = {
  id: string;
  sequence: number;
  kind: string;
  name: string;
  status: string;
  scheduledAt: string | null;
  timezone: string | null;
  mode: string | null;
  venue: string | null;
  meetingUrl: string | null;
  resultsDueAt: string | null;
  participants: Array<{
    applicationId: string;
    displayName: string | null;
    email: string | null;
    result: {
      id: string;
      status: string;
      outcome: ResultOutcome;
      waitlistRank: number | null;
      scorePercent: number | null;
      reasonCategory:
        | "APTITUDE"
        | "TECHNICAL"
        | "COMMUNICATION"
        | "OTHER"
        | null;
      candidateMessage: string | null;
    } | null;
  }>;
};

type Draft = {
  outcome: ResultOutcome;
  waitlistRank: string;
  scorePercent: string;
  reasonCategory: string;
  candidateMessage: string;
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatWhen(
  value: string | null,
  timezone: string | null,
) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone:
      timezone ?? "Asia/Kolkata",
  }).format(new Date(value));
}


export function RecruiterResultControls({
  rounds,focusApplicantId,
}: {
  rounds: RecruiterRound[];
  focusApplicantId?:string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingKey, setPendingKey] =
    useState<string | null>(null);
  const [selected,setSelected]=useState<Record<string,string[]>>(()=>{
    if(!focusApplicantId)return {};
    const initial:Record<string,string[]>={};
    for(const round of rounds){
      if(round.kind==="TALK"||!["SCHEDULED","COMPLETED"].includes(round.status))continue;
      if(round.participants.some(p=>p.applicationId===focusApplicantId&&p.result?.status!=="APPLIED")){
        initial[round.id]=[focusApplicantId];
      }
    }
    return initial;
  });
  const [bulkPending,setBulkPending]=useState<string|null>(null);
  const [confirmRoundId,setConfirmRoundId]=useState<string|null>(null);
  const bulkSubmissionLock=useRef(false);
  const singleSubmissionLock=useRef(false);
  const [activeRoundId,setActiveRoundId]=useState<string|null>(()=>
    focusApplicantId?rounds.find(round=>round.kind!=="TALK"&&
      ["SCHEDULED","COMPLETED"].includes(round.status)&&
      round.participants.some(p=>p.applicationId===focusApplicantId&&p.result?.status!=="APPLIED"))?.id??null:null);
  const [undoHistory,setUndoHistory]=useState<Array<Record<string,Draft>>>([]);
  function draftSelectedOutcome(roundId:string,outcome:ResultOutcome){
    const ids=selected[roundId]??[];
    if(!ids.length)return;
    setUndoHistory(prev=>[drafts,...prev].slice(0,50));
    setDrafts(prev=>{
      const next={...prev};
      for(const id of ids){
        const key=roundId+":"+id;
        if(prev[key])next[key]={...prev[key],outcome};
      }
      return next;
    });
  }
  function undoDraftOutcome(){
    if(!undoHistory.length)return;
    setDrafts(undoHistory[0]!);
    setUndoHistory(prev=>prev.slice(1));
  }


  const initial = useMemo(() => {
    const entries: Array<
      [string, Draft]
    > = [];
    for (const round of rounds) {
      for (const participant of round.participants) {
        const result = participant.result;
        entries.push([
          round.id +
            ":" +
            participant.applicationId,
          {
            outcome:
              result?.outcome ?? "PASS",
            waitlistRank:
              result?.waitlistRank?.toString() ??
              "",
            scorePercent:
              result?.scorePercent?.toString() ??
              "",
            reasonCategory:
              result?.reasonCategory ?? "",
            candidateMessage:
              result?.candidateMessage ?? "",
          },
        ]);
      }
    }
    return Object.fromEntries(entries);
  }, [rounds]);

  const [drafts, setDrafts] =
    useState<Record<string, Draft>>(
      initial,
    );

  async function stage(
    roundId: string,
    applicationId: string,
  ) {
    if(bulkSubmissionLock.current||singleSubmissionLock.current||pendingKey!==null)return;
    const key =
      roundId + ":" + applicationId;
    const draft = drafts[key];
    if (!draft) return;

    if (
      draft.outcome !== "PASS" &&
      !draft.candidateMessage.trim()
    ) {
      showToast({
        tone: "error",
        title: "Candidate message required",
        description:
          "Non-pass outcomes require a learner-safe message.",
      });
      return;
    }

    if (
      draft.outcome === "HOLD" &&
      (!draft.waitlistRank.trim() ||
        !Number.isInteger(Number(draft.waitlistRank)) ||
        Number(draft.waitlistRank) <= 0 ||
        Number(draft.waitlistRank) > 100000)
    ) {
      showToast({
        tone: "error",
        title: "Waitlist rank required",
        description:
          "Hold outcomes require a positive waitlist rank.",
      });
      return;
    }

    if (draft.candidateMessage.trim().length > 1000) {
      showToast({tone:"error",title:"Candidate message too long",description:"Keep the candidate message under 1001 characters."});
      return;
    }
    const score = draft.scorePercent.trim();
    if (score && (!Number.isInteger(Number(score)) || Number(score) < 0 || Number(score) > 100)) {
      showToast({
        tone: "error",
        title: "Invalid score",
        description: "Every selected score must be between 0 and 100.",
      });
      return;
    }

    singleSubmissionLock.current=true;
    setPendingKey(key);
    try {
      await apiFetch(
        "/api/placements/rounds/" +
          roundId +
          "/results",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            applicationId,
            outcome: draft.outcome,
            waitlistRank:
              draft.outcome === "HOLD"
                ? Number(
                    draft.waitlistRank,
                  )
                : null,
            scorePercent:
              draft.scorePercent
                ? Number(
                    draft.scorePercent,
                  )
                : null,
            reasonCategory:
              draft.reasonCategory ||
              null,
            candidateMessage:
              draft.candidateMessage.trim() ||
              null,
          }),
        },
      );
      showToast({
        tone: "success",
        title: "Result staged",
        description:
          "The employer result is staged for the college placement team to review and apply.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not stage result",
        description: error instanceof Error?error.message:friendlyApiError({}),
      });
    } finally {
      singleSubmissionLock.current=false;
      setPendingKey(null);
    }
  }


  async function stageSelected(round:RecruiterRound,reviewed=false){
    if(bulkSubmissionLock.current||singleSubmissionLock.current||bulkPending!==null||pendingKey!==null)return;
    const chosen=new Set(selected[round.id]??[]);
    const participants=round.participants.filter(p=>chosen.has(p.applicationId)&&p.result?.status!=="APPLIED");
    if(!participants.length){showToast({tone:"error",title:"No candidates selected",description:"Select candidates who do not have applied results."});return;}
    for(const participant of participants){
      const draft=drafts[round.id+":"+participant.applicationId];
      if(!draft||draft.outcome!=="PASS"&&!draft.candidateMessage.trim()||
        draft?.outcome==="HOLD"&&(!draft.waitlistRank||!Number.isInteger(Number(draft.waitlistRank))||Number(draft.waitlistRank)<=0||Number(draft.waitlistRank)>100000)){
        showToast({tone:"error",title:"Complete candidate outcomes",description:"Every selected row needs a valid outcome, waitlist rank when held, and a message for non-pass results."});
        return;
      }
    }
    if(participants.some(p=>(drafts[round.id+":"+p.applicationId]?.candidateMessage.trim().length??0)>1000)){
      showToast({tone:"error",title:"Candidate message too long",description:"Keep the candidate message under 1001 characters."});
      return;
    }
    const ranks=participants.flatMap(p=>{
      const d=drafts[round.id+":"+p.applicationId];
      return d?.outcome==="HOLD"?[Number(d.waitlistRank)]:[];
    });
    if(new Set(ranks).size!==ranks.length){
      showToast({tone:"error",title:"Duplicate waitlist rank",
        description:"Give every selected waitlisted candidate a distinct rank."});
      return;
    }
    for(const participant of participants){
      const draft=drafts[round.id+":"+participant.applicationId]!;
      const raw=draft.scorePercent.trim();
      if(raw && (!Number.isInteger(Number(raw))||Number(raw)<0||Number(raw)>100)){
        showToast({tone:"error",title:"Invalid score",description:"Every selected score must be between 0 and 100."});
        return;
      }
    }
    if(!reviewed){setConfirmRoundId(round.id);return;}
    bulkSubmissionLock.current=true;
    setBulkPending(round.id);
    const succeeded:string[]=[];
    let failures=0;
    for(const participant of participants){
      const draft=drafts[round.id+":"+participant.applicationId]!;
      try{
        await apiFetch("/api/placements/rounds/"+encodeURIComponent(round.id)+"/results",{
          method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
          body:JSON.stringify({
            applicationId:participant.applicationId,outcome:draft.outcome,
            waitlistRank:draft.outcome==="HOLD"?Number(draft.waitlistRank):null,
            scorePercent:draft.scorePercent?Number(draft.scorePercent):null,
            reasonCategory:draft.reasonCategory||null,candidateMessage:draft.candidateMessage.trim()||null,
          }),
        });
        succeeded.push(participant.applicationId);
      }catch{failures++;}
    }
    setSelected(current=>({...current,
      [round.id]:(current[round.id]??[]).filter(id=>!succeeded.includes(id))}));
    showToast({tone:failures?"error":"success",
      title:failures?"Some results could not be sent":"Sent to the placement cell to verify",
      description:succeeded.length+" sent to the placement cell to verify. "+failures+
        " failed; failed selections remain checked for retry.",
    });
    bulkSubmissionLock.current=false;
    setBulkPending(null);
    if(succeeded.length)router.refresh();
  }

  return (
    <div className="space-y-5" tabIndex={0} role="region" aria-label="Recruiter results editor" aria-keyshortcuts="S W H R A Z"
      onKeyDown={event=>{
        if(event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey||pendingKey!==null||bulkPending!==null)return;
        const target=event.target as HTMLElement;
        if(target.closest("input,textarea,select,button,[contenteditable=true]"))return;
        const key=event.key.toLowerCase();
        if(key==="z"&&undoHistory.length){event.preventDefault();undoDraftOutcome();return;}
        if(!activeRoundId)return;
        const outcome=key==="s"?"PASS":key==="w"||key==="h"?"HOLD":
          key==="r"?"FAIL":key==="a"?"ABSENT":null;
        if(outcome){event.preventDefault();draftSelectedOutcome(activeRoundId,outcome);}
      }}>
      {rounds.length === 0 ? (
        <p className="m-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-5 text-sm text-muted-foreground">
          The placement team has not configured any rounds yet.
        </p>
      ) : (
        rounds.map((round) => {
          const evaluative =
            round.kind !== "TALK";
          const canStage =
            evaluative &&
            (round.status === "SCHEDULED" ||
              round.status ===
                "COMPLETED");

          return (
            <article
              key={round.id}
              className="rounded-[var(--lms-radius-card)] border border-border bg-surface"
            >
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-base font-semibold text-foreground">
                    {round.sequence}.{" "}
                    {round.name}
                  </h2>
                  <StatusBadge
                    tone={
                      round.status ===
                      "COMPLETED"
                        ? "success"
                        : round.status ===
                            "SCHEDULED"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {humanize(
                      round.status,
                    )}
                  </StatusBadge>
                </div>
                {canStage?<div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-body">
                  <span aria-live="polite" aria-atomic="true">{(selected[round.id]??[]).length} selected for results</span>
                  <span className="text-muted-foreground">S Pass · W/H Hold · R Fail · A Absent · Z Undo (draft only)</span>
                  {([
                    ["PASS","Pass"],["HOLD","Waitlist"],["FAIL","Not selected"],["ABSENT","Absent"],
                  ] as const).map(([outcome,label])=><Button key={outcome} type="button"
                    onClick={()=>{setActiveRoundId(round.id);draftSelectedOutcome(round.id,outcome);}}
                    disabled={bulkPending!==null||pendingKey!==null||!(selected[round.id]??[]).length}
                    variant="secondary">
                    {label}
                  </Button>)}
                  <Button type="button" disabled={bulkPending!==null||pendingKey!==null||undoHistory.length===0}
                    onClick={undoDraftOutcome} variant="secondary">
                    Undo draft
                  </Button>
                  <Button type="button" disabled={bulkPending!==null||pendingKey!==null||(selected[round.id]??[]).length===0}
                    
                    onClick={()=>void stageSelected(round)}>
                    {bulkPending===round.id?"Sending results…":
                      "Send "+(selected[round.id]??[]).length+" results"}
                  </Button>
                  <Button type="button" disabled={bulkPending!==null||pendingKey!==null}
                    variant="secondary"
                    onClick={()=>{setActiveRoundId(round.id);setSelected(old=>({...old,[round.id]:
                      old[round.id]?.length===round.participants.filter(p=>p.result?.status!=="APPLIED").length?
                        []:round.participants.filter(p=>p.result?.status!=="APPLIED").map(p=>p.applicationId)}));}}>
                    {(selected[round.id]??[]).length?"Clear selection":"Select all eligible"}
                  </Button>
                </div>:null}
                <p className="mt-1 text-sm text-body">
                  {humanize(round.kind)} ·{" "}
                  {formatWhen(
                    round.scheduledAt,
                    round.timezone,
                  )}
                  {round.venue
                    ? " · " + round.venue
                    : ""}
                </p>
                {round.meetingUrl ? (
                  <a
                    href={round.meetingUrl}
                    
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-primary-text hover:text-primary-hover"
                  >
                    Open meeting →
                  </a>
                ) : null}
              </div>

              {!evaluative ? (
                <p className="m-0 px-5 py-5 text-sm text-muted-foreground">
                  Informational rounds do not collect candidate outcomes.
                </p>
              ) : round.participants.length ===
                0 ? (
                <p className="m-0 px-5 py-5 text-sm text-muted-foreground">
                  No candidates are eligible for this round yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {round.participants.map(
                    (participant) => {
                      const key =
                        round.id +
                        ":" +
                        participant.applicationId;
                      const draft =
                        drafts[key] ?? {
                          outcome:
                            "PASS" as const,
                          waitlistRank: "",
                          scorePercent: "",
                          reasonCategory: "",
                          candidateMessage: "",
                        };
                      const applied =
                        participant.result
                          ?.status ===
                        "APPLIED";
                      const staged =
                        participant.result
                          ?.status ===
                        "STAGED";

                      return (
                        <div
                          key={
                            participant.applicationId
                          }
                          className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]"
                        >
                          <div>
                            {canStage&&!applied?<label className="mb-2 flex items-center gap-2 text-xs text-body">
                              <Checkbox checked={(selected[round.id]??[]).includes(participant.applicationId)}
                                onFocus={()=>setActiveRoundId(round.id)}
                                onChange={event=>setSelected(old=>{
                                  const current=old[round.id]??[];
                                  return {...old,[round.id]:event.target.checked?
                                    [...new Set([...current,participant.applicationId])]:
                                    current.filter(id=>id!==participant.applicationId)};
                                })}/>
                              Select for bulk results
                            </label>:null}
                            <p className="m-0 font-semibold text-foreground">
                              {participant.displayName ??
                                "Candidate"}
                            </p>
                            <p className="mt-1 text-sm text-body">
                              {participant.email ??
                                "No email shared"}
                            </p>
                            {participant.result ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <StatusBadge
                                  tone={
                                    applied
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {humanize(
                                    participant
                                      .result
                                      .status,
                                  )}
                                </StatusBadge>
                                <StatusBadge>
                                  {humanize(
                                    participant
                                      .result
                                      .outcome,
                                  )}
                                </StatusBadge>
                              </div>
                            ) : null}
                          </div>

                          {applied ? (
                            <p className="m-0 text-sm text-muted-foreground">
                              The placement team applied this result. It is now part of the learner&apos;s official progression.
                            </p>
                          ) : canStage ? (
                            <div className="grid gap-3 lg:grid-cols-2">
                              <label>
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Outcome
                                </span>
                                <Select
                                  aria-label="Outcome"
                                  className="w-full"
                                  value={
                                    draft.outcome
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          outcome:
                                            event
                                              .target
                                              .value as ResultOutcome,
                                        },
                                      }),
                                    )
                                  }
                                >
                                  <option value="PASS">
                                    Pass
                                  </option>
                                  <option value="FAIL">
                                    Fail
                                  </option>
                                  <option value="HOLD">
                                    Hold
                                  </option>
                                  <option value="ABSENT">
                                    Absent
                                  </option>
                                </Select>
                              </label>

                              <label>
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Score %
                                </span>
                                <Input
                                  aria-label="Score %"
                                  className="w-full"
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={
                                    draft.scorePercent
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          scorePercent:
                                            event
                                              .target
                                              .value,
                                        },
                                      }),
                                    )
                                  }
                                />
                              </label>

                              {draft.outcome ===
                              "HOLD" ? (
                                <label>
                                  <span className="mb-1 block text-xs font-semibold text-body">
                                    Waitlist rank
                                  </span>
                                  <Input
                                    aria-label="Waitlist rank"
                                    className="w-full"
                                    type="number"
                                    min="1"
                                    max="100000"
                                    step="1"
                                    value={
                                      draft.waitlistRank
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            waitlistRank:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                  />
                                </label>
                              ) : null}

                              <label>
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Reason category
                                </span>
                                <Select
                                  aria-label="Reason category"
                                  className="w-full"
                                  value={
                                    draft.reasonCategory
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          reasonCategory:
                                            event
                                              .target
                                              .value,
                                        },
                                      }),
                                    )
                                  }
                                >
                                  <option value="">
                                    Not specified
                                  </option>
                                  <option value="APTITUDE">
                                    Aptitude
                                  </option>
                                  <option value="TECHNICAL">
                                    Technical
                                  </option>
                                  <option value="COMMUNICATION">
                                    Communication
                                  </option>
                                  <option value="OTHER">
                                    Other
                                  </option>
                                </Select>
                              </label>

                              <label className="lg:col-span-2">
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Candidate message
                                </span>
                                <Textarea
                                  aria-label="Candidate message"
                                  className="min-h-20 w-full"
                                  value={
                                    draft.candidateMessage
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          candidateMessage:
                                            event
                                              .target
                                              .value,
                                        },
                                      }),
                                    )
                                  }
                                  maxLength={1000}
                                   placeholder="Required for fail, hold or absent outcomes."
                                />
                              </label>

                              <div className="flex items-center gap-3 lg:col-span-2">
                                <Button
                                  size="sm"
                                  disabled={
                                    pendingKey !==
                                    null || bulkPending !== null
                                  }
                                  onClick={() =>
                                    stage(
                                      round.id,
                                      participant.applicationId,
                                    )
                                  }
                                >
                                  {pendingKey ===
                                  key
                                    ? "Staging…"
                                    : staged
                                      ? "Update staged result"
                                      : "Stage result"}
                                </Button>
                                <p className="m-0 text-xs text-muted-foreground">
                                  TPO/College Admin must apply the staged result before learner progression changes.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="m-0 text-sm text-muted-foreground">
                              Results can be staged after the placement team schedules this round.
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
      <ConfirmDialog open={confirmRoundId!==null} onOpenChange={open=>{if(!open)setConfirmRoundId(null);}}
        title={"Send "+(selected[confirmRoundId??""]??[]).length+" results?"}
        confirmLabel="Send results" pending={bulkPending!==null}
        description="No result is final until the placement cell applies it."
        onConfirm={()=>{
          const round=rounds.find(item=>item.id===confirmRoundId);
          if(round){setConfirmRoundId(null);void stageSelected(round,true);}
        }}>
        <p className="text-sm text-body">Review the current candidate outcomes before sending. The placement cell verifies each result.</p>
        <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-xs text-body">
          {(rounds.find(item=>item.id===confirmRoundId)?.participants??[])
            .filter(person=>(selected[confirmRoundId??""]??[]).includes(person.applicationId))
            .slice(0,12).map(person=><li key={person.applicationId} className="break-words">
              {person.displayName??"Applicant"} · {drafts[(confirmRoundId??"")+":"+person.applicationId]?.outcome??"No result"}
            </li>)}
        </ul>
      </ConfirmDialog>
    </div>
  );
}
