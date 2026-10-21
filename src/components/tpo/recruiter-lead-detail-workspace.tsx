"use client";
import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { Dropdown } from "@/components/ui/dropdown";
import { Disclosure } from "@/components/ui/disclosure";

import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";

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
// Anchor and Link destinations retain native navigation while adopting the shared secondary-button skin.
const button = "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] leading-5 text-body transition-colors duration-200 hover:border-primary hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none md:min-h-9 md:w-auto";
const SOURCES = [
  ["", "Added by hand / Imported"], ["ALUMNI", "Alumni"],
  ["REFERRAL", "Referral"], ["LINKEDIN", "LinkedIn"],
  ["JOB_PORTAL", "Job portal"], ["EVENT", "Event or job fair"],
  ["COLD_OUTREACH", "Cold outreach"], ["COMPANY_REACHED_OUT", "Company reached out"],
  ["IMPORT", "Import"],
] as const;
const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE"] as const;
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
  const router=useRouter();
  const [confirmation,setConfirmation]=useState<"LEAVE"|"CLOSE_EDIT"|"CLOSE_NOT_NOW"|"SAVE_EDIT"|"MARK_NOT_NOW"|"CREATE_INVITE"|"CLOSE_INVITE"|null>(null);
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
  const [duplicateLead,setDuplicateLead]=useState<{id:string;name:string}|null>(null);
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
  useEffect(()=>{
    if(!editing&&!notNowOpen)return;
    const warn=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[editing,notNowOpen]);
  function confirmLeave(){
    if(!editing&&!notNowOpen)return true;
    setConfirmation("LEAVE");
    return false;
  }

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
      }).catch(()=>{if(!controller.signal.aborted)setCompanyError("Company drive details could not be loaded. Retry this section.");});
    return ()=>controller.abort();
  },[collegeId,lead?.companyName]);

  async function mutate(url: string, method: "PATCH" | "POST", body: unknown) {
    setSaving(true);
    setActionError("");
    setActionToast("");
    setDuplicateLead(null);
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
      if(url===base&&method==="PATCH"&&cause instanceof Error&&
       cause.message.startsWith("Another recruiter already")){
       for(const contact of [edit.email.trim(),edit.phone.trim()].filter(Boolean)){
        try{
         const response=await fetch("/api/placements/tpo/leads/check?collegeId="+
          encodeURIComponent(collegeId)+"&contact="+encodeURIComponent(contact),{
           credentials:"same-origin",cache:"no-store",
         });
         if(!response.ok)continue;
         const value=await response.json() as {lead?:{id:string;name:string}};
         if(value.lead?.id&&value.lead.id!==leadId){
          setDuplicateLead(value.lead);break;
         }
        }catch{/* A lookup failure must not hide the original conflict. */}
       }
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  function closeEdit(confirmed=false){
    if(saving)return;
    if(!confirmed&&editing&&lead&&(
      edit.name!==lead.name||edit.email!==(lead.emailNorm??"")||
      edit.phone!==(lead.phoneNorm??"")||edit.designation!==(lead.designation??"")||
      edit.companyName!==(lead.companyName??"")||
      edit.source!==(SOURCES.some(([code])=>code===lead.source)?lead.source??"":"")
    )){setConfirmation("CLOSE_EDIT");return;}
    setEditing(false);
  }
  function closeNotNow(confirmed=false){
    if(saving)return;
    if(!confirmed&&(notNowReason.trim()||revisitDate)){setConfirmation("CLOSE_NOT_NOW");return;}
    setNotNowOpen(false);
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
    setActionError("");setDuplicateLead(null);
    setEditing(true);
  }

  async function saveEdit(event?: React.FormEvent,confirmed=false) {
    event?.preventDefault();
    if(!confirmed){setConfirmation("SAVE_EDIT");return;}
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

  async function markNotNow(event?: React.FormEvent,confirmed=false) {
    event?.preventDefault();
    if (!notNowReason.trim()) {
      setActionError("Please tell us why this recruiter is not available now.");
      return;
    }
    if(!confirmed){setConfirmation("MARK_NOT_NOW");return;}
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

  async function createInviteLink(confirmed=false) {
    if(!confirmed){setConfirmation("CREATE_INVITE");return;}
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
    <section className="min-w-0 space-y-5">
      {(phase==="loading"||phase==="error"||!lead)?<Link href="/tpo/recruiters" onClick={event=>{if(!confirmLeave())event.preventDefault();}} className="lms-inline-link inline-flex min-h-11 items-center text-sm font-medium text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">← Recruiter leads</Link>:null}
      {phase === "loading" ? (
        <GracefulPageLoading label="Loading recruiter details…" shape="detail"/>
      ) : phase === "error" || !lead ? (
        <div role="alert" className="space-y-3 border-b border-border pb-5">
          <PageHeader title={error.includes("not found")?"Recruiter not found":"Could not load recruiter details"} />
          <p>{error || "The recruiter contact could not be found or loaded."}</p>
           <p className="text-xs text-muted-foreground">The recruiter may be missing, or the activity and follow-up services may be unavailable. Your college scope remains unchanged.</p>
          <Link href="/tpo/recruiters" className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline">
            Go to Engage
          </Link>
          <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={() => void load()}>Retry</Button>
        </div>
      ) : (
        <>
          <PageHeader
            title={lead.name}
            description={(lead.companyName || "Company not provided") +
              (lead.designation ? " · " + lead.designation : "")}
            actions={
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
              {!lead.recruiterUserId&&!lead.unsubscribedAt?<a className={button}
                href="#recruiter-invite">{lead.inviteSentAt?"Resend invite":"Invite"}</a>:null}
              <Dropdown mobileSheet align="end" label="Other recruiter actions" trigger="More ···">
                <div className="flex min-w-48 flex-col gap-1">
                  <Link href="/tpo/recruiters" className={button} onClick={event=>{if(!confirmLeave())event.preventDefault();}}>← Recruiter leads</Link>
                  <Link className={button} href={"/tpo/placements/new?company="+encodeURIComponent(lead.companyName??"")}>Create drive</Link>
                  <Link className={button} href={"/tpo/messages?tab=team&q="+encodeURIComponent(lead.companyName||lead.name)}>Team talk</Link>
                  <Button type="button" variant="ghost" className="w-full justify-start" onClick={openEdit}>Edit details</Button>
                  {lead.manualStage==="NEW"?<Button type="button" variant="ghost" disabled={saving}
                    className="w-full justify-start" onClick={()=>void mutate(base+"/contacted","POST",{collegeId})}>Mark contacted</Button>:null}
                  <Button type="button" variant="ghost" className="w-full justify-start" onClick={()=>setNotNowOpen(true)}>Not now</Button>
                </div>
              </Dropdown>
            </div>
            }
          />
          <div className="grid min-w-0 gap-x-6 gap-y-2 border-b border-border pb-4 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
              <p className="text-muted-foreground">Stage: {RECRUITER_STAGE_LEGACY_LABELS[lead.stage as TpoRecruiterLeadStage]??lead.stage}</p>
               <p className="text-muted-foreground">Added: {formatDateTimeIst(lead.createdAt)}</p>
              <p className="text-muted-foreground">Invite: {({NOT_SENT:"Not invited",NOT_INVITED:"Not invited",SENT:"Invite sent, not opened",OPENED:"Invite opened",CLICKED:"Invite opened",BOUNCED:"Invite bounced",JOINED:"Joined"} as Record<string,string>)[lead.inviteStatus]??lead.inviteStatus}</p>
              <p className="text-muted-foreground">Owner: {lead.ownerName??"Unassigned"}</p>
              <p className="text-muted-foreground">Recruiter last login: {lead.recruiterLastLoginAt?
                formatDateTimeIst(lead.recruiterLastLoginAt):"Never signed in"}</p>

          </div>
          {lead.unsubscribedAt?<Banner tone="warning">Asked not to be contacted. Invitations and outreach are unavailable.</Banner>:null}
           {lead.manualStage === "NOT_NOW" ? (
            <div role="status" className="border-l-2 border-primary bg-primary-subtle px-3 py-3 text-sm">
              Not now: {lead.notNowReason || "No reason recorded"}.
              {lead.notNowUntil ? " Revisit on " + new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(lead.notNowUntil+"T12:00:00+05:30")) : ""}
            </div>
          ) : null}
          {actionToast?<p role="status" className="border-l-2 border-primary bg-primary-subtle px-3 py-3 text-sm leading-[22px]">{actionToast}</p>:null}
          {actionError ? <p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-destructive leading-[22px]">{actionError}</p> : null}

          {lead.companyName?<Disclosure title="Company" ariaLabel="Company" className="border-b border-border py-3">
             <section aria-label="Company" className="min-w-0 space-y-2">
             <p className="mt-2 text-sm font-medium leading-[22px]">{lead.companyName}</p>
             {companySummary?<div className="mt-3 space-y-2 text-sm text-body">
               <p>{companySummary.drivesRan} drives that ran · {companySummary.acceptedOfferDrives} accepted-offer drives</p>
               <p className="text-xs text-muted-foreground leading-[20px]">Applied and offers below are stored drive counts, not verified placements.</p>
               <ul className="space-y-1">
                 {companySummary.drives.slice(0,5).map(drive=><li key={drive.id}>
                   <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline" href={"/tpo/placements/jobs/"+encodeURIComponent(drive.id)}>{drive.jobTitle}</Link>
                   {" · "+drive.applied+" applied · "+drive.offers+" offers"}
                 </li>)}
               </ul>
             </div>:companyError?<p role="status" className="mt-2 text-xs text-warning leading-[20px]">{companyError} <Button type="button" variant="link" className="min-h-11 md:min-h-9" onClick={()=>void load()}>Retry</Button></p>:
               <p role="status" className="mt-2 text-xs text-muted-foreground leading-[20px]">Loading company drives…</p>}
             <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
               See company drives, applicant counts, offers and recruiter contacts in Company Memory.
             </p>
             <Link href={"/tpo/companies?name="+encodeURIComponent(lead.companyName)}
               className="lms-inline-link mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline">
               Open company memory
             </Link>
             </section>
           </Disclosure>:null}
           <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <section className="space-y-3 border-b border-border py-5">
              <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Contact</h2>
              <dl className="space-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
                <div><dt className="text-muted-foreground">Email</dt>
                  <dd>{lead.emailNorm ? lead.unsubscribedAt?<span>{lead.emailNorm} · opted out</span>:<a href={"mailto:" + lead.emailNorm} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline">{lead.emailNorm}</a>
                    : <Button type="button" variant="link" className="min-h-11 md:min-h-9" onClick={openEdit}>Add email</Button>}</dd></div>
                <div><dt className="text-muted-foreground">Phone</dt>
                  <dd>{lead.phoneNorm ? lead.unsubscribedAt?<span>{lead.phoneNorm} · opted out</span>:<a href={"tel:" + lead.phoneNorm} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline">{lead.phoneNorm}</a>
                    : <Button type="button" variant="link" className="min-h-11 md:min-h-9" onClick={openEdit}>Add phone</Button>}</dd></div>
                <div><dt className="text-muted-foreground">Source</dt><dd>{lead.source || "Added by hand"}</dd></div>
              </dl>
              {!lead.recruiterUserId ? (
                <div id="recruiter-invite" className="space-y-2 border-t border-border pt-3">
                  <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Personal note (optional)
                    <Textarea className="mt-[6px] min-w-0 min-h-11 md:min-h-9" rows={2}
                      maxLength={500} value={invitePersonalNote} disabled={saving}
                      onChange={event=>setInvitePersonalNote(event.target.value)}/>
                  </label>
                  <Button
                    type="button"
                    variant="secondary" className="min-h-11 md:min-h-9"
                    disabled={saving||!lead.emailNorm||!lead.companyRelationshipId||Boolean(lead.unsubscribedAt)}
                    onClick={() => void createInviteLink()}
                  >
                    {lead.inviteSentAt ? "Create new invite link" : "Create invite link"}
                  </Button>
                  <p className="text-xs text-muted-foreground leading-[20px]">
                    The link expires after seven days. Creating a new link invalidates the previous one.
                    Automatic email delivery is not available; use the email draft or copy the message.
                  </p>
                  {lead.unsubscribedAt||lead.manualStage==="NOT_NOW"?
                    <p role="status" className="text-xs text-warning leading-[20px]">This person said they are not hiring from your college this season or unsubscribed.</p>:null}
                  {inviteLink ? (
                    <label className="block text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
                      Invite link
                      <Input
                        className="mt-[6px] font-mono text-xs"
                        value={inviteLink}
                        readOnly
                        onFocus={event => event.currentTarget.select()}
                      />
                    </label>
                  ) : null}
                  {inviteMessage ? <div className="space-y-2">
                    <p className="text-xs text-muted-foreground leading-[20px]">
                      Valid until {formatDateTimeIst(inviteExpiresAt)}.
                    </p>
                    <label className="block text-[length:var(--lms-font-sm)] leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">Invitation preview
                      <Textarea rows={8} readOnly value={inviteMessage} onFocus={event=>event.currentTarget.select()}
                        className="mt-1 whitespace-pre-wrap" />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
                        onClick={()=>void navigator.clipboard.writeText(inviteMessage).then(
                          ()=>setInviteNotice("Invitation message copied."),
                          ()=>setInviteNotice("Copy the message from the preview.")
                        )}>Copy message</Button>
                      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
                        onClick={()=>void navigator.clipboard.writeText(inviteLink).then(
                          ()=>setInviteNotice("Invite link copied."),
                          ()=>setInviteNotice("Copy the link from its input.")
                        )}>Copy link</Button>
                      {lead.emailNorm?<a className={button}
                        href={"mailto:"+lead.emailNorm+"?subject="+encodeURIComponent("Placement Cell recruiter invitation")+
                          "&body="+encodeURIComponent(inviteMessage)}>
                        Also email it (open draft)</a>:null}
                      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={()=>{
                        setConfirmation("CLOSE_INVITE");
                      }}>Close preview</Button>
                    </div>
                  </div>:null}
                  {inviteNotice ? (
                    <p role="status" className="text-xs text-muted-foreground leading-[20px]">{inviteNotice}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-[20px]">
                  {lead.recruiterUserId
                    ? "This contact is already linked to a recruiter account."
                    : "Invitation not available."}
                </p>
              )}
            </section>

            <section className="space-y-4 border-b border-border py-5">
              <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Log activity</h2>
              <form className="space-y-3" onSubmit={e => void addActivity(e)}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Interaction type">
                  {ACTIVITY_TYPES.map(type=><FilterChip type="button" key={type} aria-pressed={logType===type}
                    onClick={()=>{setLogType(type);setLogOutcome("");}}>{type==="CALL"?"Call":type==="EMAIL"?"Email":type==="MEETING"?"Meeting":"Note"}</FilterChip>)}
                </div>
                <details className="border-b border-border pb-3"><summary className="cursor-pointer py-2 text-[13px] font-semibold max-[767px]:flex max-[767px]:min-h-11 max-[767px]:items-center">Choose interaction type</summary><label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
                  <Select className="mt-[6px] min-w-0 min-h-11 md:min-h-9" value={logType}
                    onChange={e => {setLogType(e.target.value as typeof logType);setLogOutcome("");}}>
                    {ACTIVITY_TYPES.map(type => <option value={type} key={type}>{type}</option>)}
                  </Select>
                </label></details>
                {logType==="CALL"?<div className="flex flex-wrap gap-2" role="group" aria-label="Call outcome">
                  {["Connected","No answer","Busy","Wrong number","Not interested"].map(outcome=>
                   <FilterChip key={outcome} type="button" aria-pressed={logOutcome===outcome}
                    onClick={()=>setLogOutcome(outcome)}>{outcome}</FilterChip>)}
                </div>:null}
                <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Outcome
                  {logType==="CALL"?<Select className="mt-[6px] min-w-0 min-h-11 md:min-h-9" required
                    value={logOutcome} onChange={e=>setLogOutcome(e.target.value)}>
                    <option value="">Choose a call outcome</option>
                    {["Connected","No answer","Busy","Wrong number","Not interested"].map(value=>
                      <option key={value} value={value}>{value}</option>)}
                  </Select>:<Input className="mt-[6px] min-w-0 min-h-11 md:min-h-9" maxLength={30}
                    value={logOutcome} onChange={e=>setLogOutcome(e.target.value)}/>}
                </label>
                <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Notes
                  <Textarea className="mt-[6px] min-w-0 min-h-11 md:min-h-9" maxLength={2000} rows={3} value={logNote}
                    onChange={e => setLogNote(e.target.value)} />
                </label>
                <Button variant="primary" className="w-full min-h-11 md:min-h-9 sm:w-auto" type="submit" disabled={saving||(logType==="CALL"&&!logOutcome)||(logType==="NOTE"&&!logNote.trim())}>
                  {saving ? "Saving…" : "Log activity"}
                </Button>
              </form>
              <h3 className="font-semibold">Timeline</h3>
              {activities.length ? (
                <ol className="divide-y divide-border border-y border-border">
                  {activities.map((a,index) => (
                    <li key={a.id} className="py-3 text-sm">
                      {(!index||activityDayIst(activities[index-1].createdAt)!==activityDayIst(a.createdAt))?
                        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {activityDayIst(a.createdAt)}
                        </h4>:null}
                      <div className={a.isSystem?"text-muted-foreground":"text-body"}>
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
              ) : <p className="text-sm text-muted-foreground leading-[22px]">Nothing logged yet. A call, email, meeting or note logged above shows up here.</p>}
            </section>
          </div>

          <section className="space-y-4 border-b border-border py-5">
            <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Follow-ups</h2>
            <form className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-end"
              onSubmit={e => void addFollowup(e)}>
              <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                {([["Tomorrow",1],["In 3 days",3],["In a week",7]] as const).map(([label,days])=>
                  <Button type="button" key={label} variant="secondary" className="min-h-11 md:min-h-9" onClick={()=>{
                    const dt=new Date();dt.setDate(dt.getDate()+days);
                    dt.setHours(10,0,0,0);
                    const pad=(n:number)=>String(n).padStart(2,"0");
                    setFollowAt(dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(dt.getDate())+"T"+pad(dt.getHours())+":"+pad(dt.getMinutes()));
                  }}>{label}</Button>)}
              </div>
              <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due date and time
                <Input className="mt-[6px] min-w-0 min-h-11 md:min-h-9" type="datetime-local" required
                  value={followAt} onChange={e => setFollowAt(e.target.value)} />
              </label>
              <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Next step
                <Input className="mt-[6px] min-w-0 min-h-11 md:min-h-9" maxLength={500}
                  value={followNote} onChange={e => setFollowNote(e.target.value)} />
              </label>
              <Button variant="primary" className="w-full min-h-11 md:min-h-9 sm:w-auto" type="submit" disabled={saving}>
                Add follow-up
              </Button>
            </form>
            {followups.length ? (
              <ul className="divide-y divide-border">
                {followups.map(f => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <time className="font-medium" dateTime={f.dueAt}>{formatDateTimeIst(f.dueAt)}</time>
                      {!f.doneAt && new Date(f.dueAt).getTime()<openedAt.getTime()?
                        <StatusBadge tone="warning" className="ml-2">Overdue</StatusBadge>:null}
                      <p className="text-muted-foreground">{f.note || "No note"}</p>
                    </div>
                    {f.doneAt ? <span className="text-muted-foreground">Done</span> : (
                      <Button variant="secondary" className="min-h-11 md:min-h-9" type="button" disabled={saving} onClick={() => void mutate(
                        "/api/placements/tpo/follow-ups/" + encodeURIComponent(f.id) + "/done",
                        "POST", { collegeId },
                      )}>Mark done</Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground leading-[22px]">No next step yet. Add a follow-up above.</p>}
          </section>

          <Dialog open={editing && confirmation===null} onOpenChange={next=>{if(!next)closeEdit();}}
            title="Edit contact details" dismissible={!saving}>
              <form className="space-y-3" onSubmit={e => void saveEdit(e)}>
                {(["name", "email", "phone", "designation", "companyName"] as const).map(name => (
                  <label key={name} className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    {name === "companyName" ? "Company name" : name[0].toUpperCase() + name.slice(1)}
                    <Input className="mt-[6px] min-w-0 min-h-11 md:min-h-9" value={edit[name]}
                      autoFocus={name==="name"} required={name === "name"}
                      onChange={e => setEdit(current => ({ ...current, [name]: e.target.value }))} />
                  </label>
                ))}
                <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Found through
                  <Select className="mt-[6px] min-w-0 min-h-11 md:min-h-9" value={edit.source}
                    onChange={e => setEdit(current => ({ ...current, source: e.target.value }))}>
                    {SOURCES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </Select>
                </label>
                {actionError ? <p role="alert" className="text-destructive">{actionError}</p> : null}
                {duplicateLead?<p role="status" className="text-sm leading-[22px]">
                 Contact already exists: <Link href={"/tpo/recruiters/"+encodeURIComponent(duplicateLead.id)}
                  className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline">Open {duplicateLead.name}</Link>
                </p>:null}
                <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button variant="secondary" className="min-h-11 w-full md:min-h-9 sm:w-auto" type="button" disabled={saving} onClick={()=>closeEdit()}>Cancel</Button>
                  <Button variant="primary" className="min-h-11 w-full md:min-h-9 sm:w-auto" loading={saving} type="submit" disabled={saving}>Save</Button>
                </div>
              </form>
          </Dialog>

          <Dialog open={notNowOpen && confirmation===null} onOpenChange={next=>{if(!next)closeNotNow();}}
            title="Not now" dismissible={!saving}>
              <form className="space-y-4" onSubmit={e => void markNotNow(e)}>
                <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason
                  <Textarea className="mt-[6px] min-w-0 min-h-11 md:min-h-9" maxLength={255} rows={3}
                    value={notNowReason} autoFocus onChange={e => setNotNowReason(e.target.value)} />
                </label>
                <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Revisit on
                  <Input className="mt-[6px] min-w-0 min-h-11 md:min-h-9" type="date" value={revisitDate}
                    onChange={e => setRevisitDate(e.target.value)} />
                </label>
                {actionError ? <p role="alert" className="text-destructive">{actionError}</p> : null}
                <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button variant="secondary" className="min-h-11 w-full md:min-h-9 sm:w-auto" type="button" disabled={saving} onClick={()=>closeNotNow()}>Cancel</Button>
                  <Button variant="primary" className="min-h-11 w-full md:min-h-9 sm:w-auto" loading={saving} type="submit" disabled={saving}>Mark not now</Button>
                </div>
              </form>
          </Dialog>
          <ConfirmDialog open={confirmation!==null}
            onOpenChange={next=>{if(!next&&!saving)setConfirmation(null);}}
            title={confirmation==="LEAVE"?"Leave recruiter details?":
              confirmation==="CLOSE_EDIT"?"Discard recruiter edits?":
              confirmation==="CLOSE_NOT_NOW"?"Discard Not now changes?":
              confirmation==="SAVE_EDIT"?"Save recruiter details?":
              confirmation==="MARK_NOT_NOW"?"Mark recruiter Not now?":
              confirmation==="CREATE_INVITE"?"Create recruiter invitation?":"Close one-time invitation preview?"}
            description={confirmation==="LEAVE"?"Leave this recruiter? Unsaved changes will be lost.":
              confirmation==="CLOSE_EDIT"?"Discard unsaved recruiter changes?":
              confirmation==="CLOSE_NOT_NOW"?"Discard your Not now reason and revisit date?":
              confirmation==="SAVE_EDIT"?"Save updated recruiter details? Contact identity changes may affect duplicate checks and outreach. The update will be recorded in the activity log.":
              confirmation==="MARK_NOT_NOW"?"Mark this recruiter Not Now? The stage and reason/revisit date will be saved with an auditable change record. No invitation will be sent.":
              confirmation==="CREATE_INVITE"?"Create an invitation valid for 7 days? Any previous link will stop working.":
              "Close invitation preview? The one-time token and message will not be shown again."}
            confirmLabel={confirmation==="SAVE_EDIT"?"Save changes":
              confirmation==="MARK_NOT_NOW"?"Mark Not now":
              confirmation==="CREATE_INVITE"?"Create invitation":
              confirmation==="LEAVE"?"Leave recruiter":
              confirmation==="CLOSE_INVITE"?"Close preview":"Discard"}
            confirmVariant={confirmation==="SAVE_EDIT"||confirmation==="CREATE_INVITE"?"primary":"danger"}
            pending={saving}
            onConfirm={()=>{
              const action=confirmation;
              setConfirmation(null);
              if(action==="LEAVE"){setEditing(false);setNotNowOpen(false);router.push("/tpo/recruiters");}
              else if(action==="CLOSE_EDIT")closeEdit(true);
              else if(action==="CLOSE_NOT_NOW")closeNotNow(true);
              else if(action==="SAVE_EDIT")void saveEdit(undefined,true);
              else if(action==="MARK_NOT_NOW")void markNotNow(undefined,true);
              else if(action==="CREATE_INVITE")void createInviteLink(true);
              else if(action==="CLOSE_INVITE"){
                setInviteLink("");setInviteMessage("");setInviteNotice("");setInviteExpiresAt("");
              }
            }}/>
        </>
      )}
    </section>
  );
}
