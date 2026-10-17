"use client";

import { formatDateTimeIst } from "@/lib/format-date";
import {buildTpoRecruiterInviteMessage} from "@/modules/placements/tpo-recruiter-invite-message-model";
import {RECRUITER_STAGE_LEGACY_LABELS,type TpoRecruiterLeadStage} from "@/modules/placements/tpo-recruiter-lead-policy";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  designation: string | null;
  emailNorm: string | null;
  phoneNorm: string | null;
  companyName: string | null;
  companyRelationshipId:string|null;
  source: string | null;
  manualStage: string;
  stage: string;
  ownerName: string|null;
  inviteStatus: string;
  recruiterLastLoginAt: string|null;
  notNowReason: string | null;
  notNowUntil: string | null;
  inviteSentAt: string | null;
  recruiterUserId: string | null;
  unsubscribedAt:string|null;
  createdAt:string;
};
type CompanySummary = {
 name:string;drivesRan:number;acceptedOfferDrives:number;
 drives:Array<{id:string;jobTitle:string;applied:number;offers:number;status:string}>;
};
type Activity = {
  id: string;
  type: string;
  outcome: string | null;
  note: string | null;
  isSystem?:boolean;
  createdAt: string;
};
type Followup = {
  id: string;
  note: string | null;
  dueAt: string;
  doneAt: string | null;
};
type EditValues = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  companyName: string;
  source: string;
};
const input = "min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
const button = "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-secondary disabled:opacity-50";
const primary = "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50";
const SOURCES = [
  ["", "Added by hand / Imported"], ["ALUMNI", "Alumni"],
  ["REFERRAL", "Referral"], ["LINKEDIN", "LinkedIn"],
  ["JOB_PORTAL", "Job portal"], ["EVENT", "Event or job fair"],
  ["COLD_OUTREACH", "Cold outreach"], ["COMPANY_REACHED_OUT", "Company reached out"],
  ["IMPORT", "Import"],
] as const;
const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE"] as const;
/** Keep keyboard focus within the open recruiter dialog. */
function keepRecruiterDialogFocus(event:React.KeyboardEvent<HTMLFormElement>){
 if(event.key!=="Tab")return;
 const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
  'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]'));
 const first=controls[0],last=controls[controls.length-1];
 if(!first||!last)return;
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}

function activityDayIst(value:string){
 const time=new Date(value);
 return Number.isNaN(time.getTime())?"Date unavailable":
  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(time);
}


function messageFor(status: number, error?: string) {
  if (status === 503 && error === "DB09_MIGRATIONS_PENDING") {
    return "Recruiter details are temporarily unavailable. Please try again.";
  }
  if (status === 409) return "Another recruiter already has those contact details. Open that lead or refresh before retrying.";
  if (status === 422) return "Enter a valid email or phone number and review your contact details.";
  if (status === 404) return "The recruiter lead was not found in this college.";
  if (status === 403) return "You do not have permission for this college.";
  return "Could not complete the request. Try again.";
}

async function readResponse<T>(response: Response): Promise<T> {
  let parsed: { error?: string } & Partial<T>;
  try {
    parsed = await response.json() as { error?: string } & Partial<T>;
  } catch {
    throw new Error("Unexpected response from the server.");
  }
  if (!response.ok) throw new Error(messageFor(response.status, parsed.error));
  return parsed as T;
}

export function RecruiterLeadDetailWorkspace({
  collegeId, leadId,
}: { collegeId: string; leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companySummary,setCompanySummary]=useState<CompanySummary|null>(null);
  const [companyError,setCompanyError]=useState("");
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [openedAt] = useState(() => new Date());
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionToast,setActionToast]=useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<EditValues>({
    name: "", email: "", phone: "", designation: "", companyName: "", source: "",
  });
  const [logType, setLogType] = useState<(typeof ACTIVITY_TYPES)[number]>("CALL");
  const [logNote, setLogNote] = useState("");
  const [logOutcome, setLogOutcome] = useState("");
  const [followAt, setFollowAt] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [notNowOpen, setNotNowOpen] = useState(false);
  const [notNowReason, setNotNowReason] = useState("");
  const [revisitDate, setRevisitDate] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteNotice, setInviteNotice] = useState("");
  const [invitePersonalNote,setInvitePersonalNote]=useState("");
  const [inviteMessage,setInviteMessage]=useState("");
  const [inviteExpiresAt,setInviteExpiresAt]=useState("");

  const base = "/api/placements/tpo/leads/" + encodeURIComponent(leadId);
  const params = "?collegeId=" + encodeURIComponent(collegeId);
  const load = useCallback(async (signal?: AbortSignal) => {
    setPhase("loading");
    setError("");
    try {
      const [l, a, f] = await Promise.all([
        fetch(base + params, { signal, cache: "no-store", credentials: "same-origin" }),
        fetch(base + "/activity" + params, { signal, cache: "no-store", credentials: "same-origin" }),
        fetch(base + "/follow-ups" + params, { signal, cache: "no-store", credentials: "same-origin" }),
      ]);
      const result = await Promise.all([
        readResponse<{ lead: Lead }>(l),
        readResponse<{ activities: Activity[] }>(a),
        readResponse<{ followups: Followup[] }>(f),
      ]);
      if (signal?.aborted) return;
      setLead(result[0].lead);
      setActivities(result[1].activities);
      setFollowups(result[2].followups);
      setPhase("ready");
    } catch (cause) {
      if (signal?.aborted) return;
      setLead(null);
      setActivities([]);
      setFollowups([]);
      setError(cause instanceof Error ? cause.message : "Could not load recruiter.");
      setPhase("error");
    }
  }, [base, params]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLead(null);
      void load(controller.signal);
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const companyKey=lead?.companyName?collegeId+"|"+lead.companyName:"";
  const [prevCompanyKey,setPrevCompanyKey]=useState(companyKey);
  if(prevCompanyKey!==companyKey){setPrevCompanyKey(companyKey);setCompanySummary(null);setCompanyError("");}
  useEffect(()=>{
    if(!lead?.companyName)return;
    const controller=new AbortController();
    void fetch("/api/placements/tpo/companies/detail?collegeId="+encodeURIComponent(collegeId)+
      "&name="+encodeURIComponent(lead.companyName),{
        credentials:"same-origin",cache:"no-store",signal:controller.signal,
      }).then(async response=>{
        if(!response.ok)throw new Error("Company drive details are unavailable.");
        const payload=await response.json() as {company?:CompanySummary};
        if(!controller.signal.aborted)setCompanySummary(payload.company??null);
      }).catch(()=>{if(!controller.signal.aborted)setCompanyError("Company drive details could not be loaded.");});
    return ()=>controller.abort();
  },[collegeId,lead?.companyName]);

  async function mutate(url: string, method: "PATCH" | "POST", body: unknown) {
    setSaving(true);
    setActionError("");
    setActionToast("");
    try {
      await readResponse(await fetch(url, {
        method, credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }));
      await load();
      setActionToast(url.endsWith("/not-now")?"Not now":url.endsWith("/activity")?"Activity saved":url.endsWith("/follow-ups")?"Follow-up added":"Saved");
      return true;
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Save failed.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function openEdit() {
    if (!lead) return;
    setEdit({
      name: lead.name,
      email: lead.emailNorm ?? "",
      phone: lead.phoneNorm ?? "",
      designation: lead.designation ?? "",
      companyName: lead.companyName ?? "",
      source: SOURCES.some(([code]) => code === lead.source) ? lead.source ?? "" : "",
    });
    setActionError("");
    setEditing(true);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm(
      "Save updated recruiter details? Contact identity changes may affect " +
      "duplicate checks and outreach. The update will be recorded in the activity log.",
    )) return;
    const ok = await mutate(base, "PATCH", {
      collegeId,
      name: edit.name,
      email: edit.email.trim() || null,
      phone: edit.phone.trim() || null,
      designation: edit.designation.trim() || null,
      ...(edit.companyName.trim() ? { companyName: edit.companyName.trim() } : {}),
      source: edit.source || null,
    });
    if (ok) setEditing(false);
  }

  async function addActivity(event: React.FormEvent) {
    event.preventDefault();
    if(logType==="NOTE"&&!logNote.trim()){
      setActionError("Write a note before logging this interaction.");return;
    }
    const ok = await mutate(base + "/activity", "POST", {
      collegeId, type: logType,
      outcome: logOutcome.trim() || null,
      note: logNote.trim() || null,
    });
    if (ok) { setLogNote(""); setLogOutcome(""); }
  }

  async function addFollowup(event: React.FormEvent) {
    event.preventDefault();
    const time = new Date(followAt);
    if (!followAt || Number.isNaN(time.getTime())) {
      setActionError("Provide a valid follow-up date and time.");
      return;
    }
    if (time.getTime() <= Date.now()) {
      setActionError("Pick a future date and time for this follow-up.");
      return;
    }
    const ok = await mutate(base + "/follow-ups", "POST", {
      collegeId, dueAt: time.toISOString(), note: followNote.trim() || null,
    });
    if (ok) { setFollowAt(""); setFollowNote(""); }
  }

  async function markNotNow(event: React.FormEvent) {
    event.preventDefault();
    if (!notNowReason.trim()) {
      setActionError("Please tell us why this recruiter is not available now.");
      return;
    }
    if (!window.confirm(
      "Mark this recruiter Not Now? The stage and reason/revisit date will be " +
      "saved with an auditable change record. No invitation will be sent.",
    )) return;
    const ok = await mutate(base + "/not-now", "POST", {
      confirmed: true,
      decision: {
        collegeId,
        reason: notNowReason.trim() || null,
        revisitDate: revisitDate || null,
      },
    });
    if (ok) setNotNowOpen(false);
  }

  async function createInviteLink() {
    if (!window.confirm("Create an invitation valid for 7 days? Any previous link will stop working.")) return;
    if(lead?.unsubscribedAt){setActionError("Asked not to be contacted.");return;}
    if(!lead?.emailNorm||!lead.companyRelationshipId){
      setActionError("Add a work email and link a company before inviting.");
      return;
    }
    setSaving(true);
    setActionError("");
    setInviteNotice("");
    try {
      const response = await fetch(base + "/invite", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, sendEmail: false }),
      });
      const payload = await readResponse<{
        invite: { token: string; expiresAt: string };
      }>(response);
      const link =
        window.location.origin +
        "/recruiter-invite/" +
        encodeURIComponent(payload.invite.token);
      setInviteLink(link);
      setInviteExpiresAt(payload.invite.expiresAt);
      const prepared=buildTpoRecruiterInviteMessage({
        recruiterName:lead?.name??"Recruiter",
        companyName:lead?.companyName??null,
        inviteUrl:link,
        expiresAt:payload.invite.expiresAt,
        personalNote:invitePersonalNote,
      });
      setInviteMessage(prepared);
      try {
        await navigator.clipboard.writeText(prepared);
        setInviteNotice("Invitation message copied. Older links are now invalid.");
      } catch {
        setInviteNotice("Invitation created. Copy the message below before closing.");
      }
      await load();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not create invite link.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <Link href="/tpo/recruiters" className="text-sm font-medium text-primary-text hover:underline">
        ← Recruiter leads
      </Link>
      {phase === "loading" ? (
        <p role="status" className="rounded-lg border border-border bg-surface p-6">Loading recruiter details…</p>
      ) : phase === "error" || !lead ? (
        <div role="alert" className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h1 className="text-lg font-semibold">This recruiter isn&apos;t in Engage</h1>
          <p>{error || "The recruiter contact could not be found or loaded."}</p>
          <Link href="/tpo/recruiters" className="inline-flex min-h-10 items-center text-primary-text underline">
            Go to Engage
          </Link>
          <button type="button" className={button} onClick={() => void load()}>Retry</button>
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">
                {lead.companyName || "Company not provided"}
                {lead.designation ? " · " + lead.designation : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Stage: {RECRUITER_STAGE_LEGACY_LABELS[lead.stage as TpoRecruiterLeadStage]??lead.stage}</p>
               <p className="mt-1 text-sm text-muted-foreground">Added: {formatDateTimeIst(lead.createdAt)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Invite: {({NOT_SENT:"Not invited",NOT_INVITED:"Not invited",SENT:"Invite sent, not opened",OPENED:"Invite opened",CLICKED:"Invite opened",BOUNCED:"Invite bounced",JOINED:"Joined"} as Record<string,string>)[lead.inviteStatus]??lead.inviteStatus}</p>
              <p className="mt-1 text-sm text-muted-foreground">Owner: {lead.ownerName??"Unassigned"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Recruiter last login: {lead.recruiterLastLoginAt?
                formatDateTimeIst(lead.recruiterLastLoginAt):"Never signed in"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!lead.recruiterUserId&&!lead.unsubscribedAt?<a className={button}
                 href="#recruiter-invite">{lead.inviteSentAt?"Resend invite":"Invite"}</a>:null}
               <Link className={button} href={"/tpo/placements/new?company="+encodeURIComponent(lead.companyName??"")}>Create drive</Link>
               {lead.recruiterUserId?<Link className={button} href="/tpo/messages">Team talk</Link>:null}
               <button type="button" className={button} onClick={openEdit}>Edit details</button>
              {lead.manualStage === "NEW" ? (
                <button type="button" className={button} disabled={saving} onClick={() => void mutate(
                  base + "/contacted", "POST", { collegeId },
                )}>Mark contacted</button>
              ) : null}
              <button type="button" className={button} onClick={() => setNotNowOpen(true)}>Not now…</button>
            </div>
          </header>
          {lead.unsubscribedAt?<div role="alert"
             className="rounded-lg border border-warning bg-surface p-3 text-sm text-body">
             Asked not to be contacted. Invitations and outreach are unavailable.
           </div>:null}
           {lead.manualStage === "NOT_NOW" ? (
            <div role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm">
              Not now: {lead.notNowReason || "No reason recorded"}.
              {lead.notNowUntil ? " Revisit on " + new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(lead.notNowUntil+"T12:00:00+05:30")) : ""}
            </div>
          ) : null}
          {actionToast?<p role="status" className="rounded-md border border-border p-3 text-sm">{actionToast}</p>:null}
          {actionError ? <p role="alert" className="rounded-md border border-border p-3 text-sm text-destructive">{actionError}</p> : null}

          {lead.companyName?<section aria-label="Company" className="rounded-lg border border-border bg-surface p-5">
             <h2 className="font-semibold text-foreground">Company</h2>
             <p className="mt-2 text-sm font-medium">{lead.companyName}</p>
             {companySummary?<div className="mt-3 space-y-2 text-sm text-body">
               <p>{companySummary.drivesRan} drives that ran · {companySummary.acceptedOfferDrives} accepted-offer drives</p>
               <p className="text-xs text-muted-foreground">Applied and offers below are stored drive counts, not verified placements.</p>
               <ul className="space-y-1">
                 {companySummary.drives.slice(0,5).map(drive=><li key={drive.id}>
                   <Link className="text-primary-text underline" href={"/tpo/placements/jobs/"+encodeURIComponent(drive.id)}>{drive.jobTitle}</Link>
                   {" · "+drive.applied+" applied · "+drive.offers+" offers"}
                 </li>)}
               </ul>
             </div>:companyError?<p role="status" className="mt-2 text-xs text-warning">{companyError}</p>:
               <p role="status" className="mt-2 text-xs text-muted-foreground">Loading company drives…</p>}
             <p className="mt-1 text-xs text-muted-foreground">
               See company drives, applicant counts, offers and recruiter contacts in Company Memory.
             </p>
             <Link href={"/tpo/companies?name="+encodeURIComponent(lead.companyName)}
               className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
               Open company memory
             </Link>
           </section>:null}
           <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Contact</h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-muted-foreground">Email</dt>
                  <dd>{lead.emailNorm ? lead.unsubscribedAt?<span>{lead.emailNorm} · opted out</span>:<a href={"mailto:" + lead.emailNorm} className="text-primary-text underline">{lead.emailNorm}</a>
                    : <button type="button" className="text-primary-text underline" onClick={openEdit}>Add email</button>}</dd></div>
                <div><dt className="text-muted-foreground">Phone</dt>
                  <dd>{lead.phoneNorm ? lead.unsubscribedAt?<span>{lead.phoneNorm} · opted out</span>:<a href={"tel:" + lead.phoneNorm} className="text-primary-text underline">{lead.phoneNorm}</a>
                    : <button type="button" className="text-primary-text underline" onClick={openEdit}>Add phone</button>}</dd></div>
                <div><dt className="text-muted-foreground">Source</dt><dd>{lead.source || "Added by hand"}</dd></div>
              </dl>
              {!lead.recruiterUserId ? (
                <div id="recruiter-invite" className="space-y-2 border-t border-border pt-3">
                  <label className="block text-xs">Personal note (optional)
                    <textarea className={input + " mt-1"} rows={2}
                      maxLength={500} value={invitePersonalNote} disabled={saving}
                      onChange={event=>setInvitePersonalNote(event.target.value)}/>
                  </label>
                  <button
                    type="button"
                    className={button}
                    disabled={saving||!lead.emailNorm||!lead.companyRelationshipId||Boolean(lead.unsubscribedAt)}
                    onClick={() => void createInviteLink()}
                  >
                    {lead.inviteSentAt ? "Create new invite link" : "Create invite link"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    The link expires after seven days. Creating a new link invalidates the previous one.
                    Automatic email delivery is not available; use the email draft or copy the message.
                  </p>
                  {lead.unsubscribedAt||lead.manualStage==="NOT_NOW"?
                    <p role="status" className="text-xs text-warning">This person said they are not hiring from your college this season or unsubscribed.</p>:null}
                  {inviteLink ? (
                    <label className="block text-xs">
                      Invite link
                      <input
                        className={input + " mt-1 font-mono text-xs"}
                        value={inviteLink}
                        readOnly
                        onFocus={event => event.currentTarget.select()}
                      />
                    </label>
                  ) : null}
                  {inviteMessage ? <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Valid until {formatDateTimeIst(inviteExpiresAt)}.
                    </p>
                    <label className="block text-xs">Invitation preview
                      <textarea rows={8} readOnly value={inviteMessage} onFocus={event=>event.currentTarget.select()}
                        className={input+" mt-1 whitespace-pre-wrap"} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={button}
                        onClick={()=>void navigator.clipboard.writeText(inviteMessage).then(
                          ()=>setInviteNotice("Invitation message copied."),
                          ()=>setInviteNotice("Copy the message from the preview.")
                        )}>Copy message</button>
                      <button type="button" className={button}
                        onClick={()=>void navigator.clipboard.writeText(inviteLink).then(
                          ()=>setInviteNotice("Invite link copied."),
                          ()=>setInviteNotice("Copy the link from its input.")
                        )}>Copy link</button>
                      {lead.emailNorm?<a className={button}
                        href={"mailto:"+lead.emailNorm+"?subject="+encodeURIComponent("Placement Cell recruiter invitation")+
                          "&body="+encodeURIComponent(inviteMessage)}>
                        Also email it (open draft)</a>:null}
                      <button type="button" className={button} onClick={()=>{
                        if(!window.confirm("Close invitation preview? The one-time token and message will not be shown again."))return;
                        setInviteLink("");setInviteMessage("");setInviteNotice("");setInviteExpiresAt("");
                      }}>Close preview</button>
                    </div>
                  </div>:null}
                  {inviteNotice ? (
                    <p role="status" className="text-xs text-muted-foreground">{inviteNotice}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {lead.recruiterUserId
                    ? "This contact is already linked to a recruiter account."
                    : "Invitation not available."}
                </p>
              )}
            </section>

            <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Log an interaction</h2>
              <form className="space-y-3" onSubmit={e => void addActivity(e)}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Interaction type">
                  {ACTIVITY_TYPES.map(type=><button type="button" key={type}
                    className={logType===type?primary:button} aria-pressed={logType===type}
                    onClick={()=>{setLogType(type);setLogOutcome("");}}>{type==="CALL"?"Call":type==="EMAIL"?"Email":type==="MEETING"?"Meeting":"Note"}</button>)}
                </div>
                <label className="block text-sm">Type
                  <select className={input + " mt-1"} value={logType}
                    onChange={e => {setLogType(e.target.value as typeof logType);setLogOutcome("");}}>
                    {ACTIVITY_TYPES.map(type => <option value={type} key={type}>{type}</option>)}
                  </select>
                </label>
                {logType==="CALL"?<div className="flex flex-wrap gap-2" role="group" aria-label="Call outcome">
                  {["Connected","No answer","Busy","Wrong number","Not interested"].map(outcome=>
                   <button key={outcome} type="button" aria-pressed={logOutcome===outcome}
                    className={logOutcome===outcome?primary:button}
                    onClick={()=>setLogOutcome(outcome)}>{outcome}</button>)}
                </div>:null}
                <label className="block text-sm">Outcome
                  {logType==="CALL"?<select className={input + " mt-1"} required
                    value={logOutcome} onChange={e=>setLogOutcome(e.target.value)}>
                    <option value="">Choose a call outcome</option>
                    {["Connected","No answer","Busy","Wrong number","Not interested"].map(value=>
                      <option key={value} value={value}>{value}</option>)}
                  </select>:<input className={input+" mt-1"} maxLength={30}
                    value={logOutcome} onChange={e=>setLogOutcome(e.target.value)}/>}
                </label>
                <label className="block text-sm">Notes
                  <textarea className={input + " mt-1"} maxLength={2000} rows={3} value={logNote}
                    onChange={e => setLogNote(e.target.value)} />
                </label>
                <button className={primary} type="submit" disabled={saving||(logType==="CALL"&&!logOutcome)||(logType==="NOTE"&&!logNote.trim())}>
                  {saving ? "Saving…" : "Log activity"}
                </button>
              </form>
              <h3 className="font-semibold">Timeline</h3>
              {activities.length ? (
                <ol className="space-y-3">
                  {activities.map((a,index) => (
                    <li key={a.id} className="text-sm">
                      {(!index||activityDayIst(activities[index-1].createdAt)!==activityDayIst(a.createdAt))?
                        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {activityDayIst(a.createdAt)}
                        </h4>:null}
                      <div className={a.isSystem?"rounded-md border border-border bg-surface-secondary px-3 py-2 text-muted-foreground":"border-l-2 border-border pl-3"}>
                      <span className="font-semibold">{a.type==="CALL"?"Call":a.type==="EMAIL"?"Email":a.type==="MEETING"?"Meeting":a.type==="NOTE"?"Note":a.type==="SYSTEM"?"System":a.type.replaceAll("_"," ")}</span>
                      {a.outcome ? " · " + a.outcome : ""}
                      <time className="ml-2 text-muted-foreground" dateTime={a.createdAt}>
                        {formatDateTimeIst(a.createdAt)}
                      </time>
                      {a.note ? <p className="mt-1 whitespace-pre-wrap">{a.note}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">Nothing logged yet. A call, email, meeting or note logged above shows up here.</p>}
            </section>
          </div>

          <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">Follow-ups</h2>
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end"
              onSubmit={e => void addFollowup(e)}>
              <div className="flex flex-wrap gap-2 md:col-span-3">
                {([["Tomorrow",1],["In 3 days",3],["In a week",7]] as const).map(([label,days])=>
                  <button type="button" key={label} className={button} onClick={()=>{
                    const dt=new Date();dt.setDate(dt.getDate()+days);
                    dt.setHours(10,0,0,0);
                    const pad=(n:number)=>String(n).padStart(2,"0");
                    setFollowAt(dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(dt.getDate())+"T"+pad(dt.getHours())+":"+pad(dt.getMinutes()));
                  }}>{label}</button>)}
              </div>
              <label className="block text-sm">Due date and time
                <input className={input + " mt-1"} type="datetime-local" required
                  value={followAt} onChange={e => setFollowAt(e.target.value)} />
              </label>
              <label className="block text-sm">Next step
                <input className={input + " mt-1"} maxLength={500}
                  value={followNote} onChange={e => setFollowNote(e.target.value)} />
              </label>
              <button className={primary} type="submit" disabled={saving}>
                Add follow-up
              </button>
            </form>
            {followups.length ? (
              <ul className="space-y-2">
                {followups.map(f => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                    <div>
                      <time className="font-medium" dateTime={f.dueAt}>{formatDateTimeIst(f.dueAt)}</time>
                      {!f.doneAt && new Date(f.dueAt).getTime()<openedAt.getTime()?
                        <span className="ml-2 rounded border border-warning px-2 py-0.5 text-xs text-warning">Overdue</span>:null}
                      <p className="text-muted-foreground">{f.note || "No note"}</p>
                    </div>
                    {f.doneAt ? <span className="text-muted-foreground">Done</span> : (
                      <button className={button} type="button" disabled={saving} onClick={() => void mutate(
                        "/api/placements/tpo/follow-ups/" + encodeURIComponent(f.id) + "/done",
                        "POST", { collegeId },
                      )}>Mark done</button>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No next step yet. Add a follow-up above.</p>}
          </section>

          {editing ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
              <form className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
                role="dialog" aria-modal="true" aria-label="Edit contact details"
                onSubmit={e => void saveEdit(e)}>
                <h2 className="text-lg font-semibold">Edit contact details</h2>
                {(["name", "email", "phone", "designation", "companyName"] as const).map(name => (
                  <label key={name} className="block text-sm">
                    {name === "companyName" ? "Company name" : name[0].toUpperCase() + name.slice(1)}
                    <input className={input + " mt-1"} value={edit[name]}
                      required={name === "name"}
                      onChange={e => setEdit(current => ({ ...current, [name]: e.target.value }))} />
                  </label>
                ))}
                <label className="block text-sm">Found through
                  <select className={input + " mt-1"} value={edit.source}
                    onChange={e => setEdit(current => ({ ...current, source: e.target.value }))}>
                    {SOURCES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </label>
                {actionError ? <p role="alert" className="text-destructive">{actionError}</p> : null}
                <div className="flex justify-end gap-2">
                  <button className={button} type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
                  <button className={primary} type="submit" disabled={saving}>Save</button>
                </div>
              </form>
            </div>
          ) : null}

          {notNowOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
              <form className="w-full max-w-md space-y-4 rounded-xl bg-surface p-6 shadow-xl"
                role="dialog" aria-modal="true" aria-label="Mark recruiter not now"
                onSubmit={e => void markNotNow(e)}>
                <h2 className="text-lg font-semibold">Mark not now</h2>
                <label className="block text-sm">Reason
                  <textarea className={input + " mt-1"} maxLength={255} rows={3}
                    value={notNowReason} onChange={e => setNotNowReason(e.target.value)} />
                </label>
                <label className="block text-sm">Revisit on
                  <input className={input + " mt-1"} type="date" value={revisitDate}
                    onChange={e => setRevisitDate(e.target.value)} />
                </label>
                {actionError ? <p role="alert" className="text-destructive">{actionError}</p> : null}
                <div className="flex justify-end gap-2">
                  <button className={button} type="button" disabled={saving} onClick={() => setNotNowOpen(false)}>Cancel</button>
                  <button className={primary} type="submit" disabled={saving}>Mark not now</button>
                </div>
              </form>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
