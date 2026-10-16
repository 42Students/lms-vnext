"use client";

import Link from "next/link";
import { TPO_OWNER_PAGE_COPY } from "@/modules/placements/tpo-page-copy";
import {filterEngageRoster,type EngageRosterFilters} from "@/modules/placements/tpo-engage-filter-model";
import {recruiterTableExportCsv,recruiterTableExportGrid,recruiterTableExportTsv} from "@/modules/placements/tpo-recruiter-export-model";
import {recruiterLeadsXlsx} from "@/modules/placements/tpo-recruiter-xlsx-export";
import { RECRUITER_STAGE_LEGACY_LABELS, type TpoRecruiterLeadStage } from "@/modules/placements/tpo-recruiter-lead-policy";
import { engageNeedsCounts, matchesEngageNeed, type EngageNeed } from "@/modules/placements/tpo-engage-needs-model";
import {
  RECRUITER_ATTENTION_LABELS,
  type RecruiterAttentionChip,
} from "@/modules/placements/tpo-recruiter-attention-model";
import { RecruiterLeadCsvImport } from "./recruiter-lead-csv-import";
import {RecruiterRosterDisplayControls} from "./recruiter-roster-display-controls";
import {ENGAGE_DEFAULT_COLUMNS,normalizeEngageColumns,sortEngageRows,
 type EngageColumn,type EngageSort} from "@/modules/placements/tpo-recruiter-table-view-model";
import { RecruiterBulkStageControls } from "./recruiter-bulk-stage-controls";
import { RecruiterBulkOwnerControls } from "./recruiter-bulk-owner-controls";
import {RecruiterBulkInviteControls} from "./recruiter-bulk-invite-controls";
import {RecruiterSavedViewControls} from "./recruiter-saved-view-controls";
import {tpoCompanyDirectoryCsv} from "@/modules/placements/tpo-company-directory-export-model";
import { useCallback, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  emailNorm: string | null;
  phoneNorm: string | null;
  companyName: string | null;
  companyRelationshipId:string|null;
  designation: string | null;
  source: string | null;
  manualStage: string;
  stage: TpoRecruiterLeadStage;
  ownerMembershipId: string | null;
  notNowReason: string | null;
  inviteSentAt: string | null;
  recruiterUserId: string | null;
  unsubscribedAt: string | null;
  chips: RecruiterAttentionChip[];
  quietDays: number;
  createdAt:string;
  ownerName:string|null;
  lastActivityAt:string|null;
  nextFollowupAt:string|null;
  inviteStatus:string;
};

type CompanySummary = {
  key: string;
  name: string;
  aliases: string[];
  contacts: number;
  people: {id:string;name:string}[];
  activeContacts: number;
  drivesRan: number;
  acceptedOfferDrives: number;
  confirmedJoinedDrives: number;
  studentsPlaced: number | null;
  studentsPlacedEvidence: string;
};
type Phase = "loading" | "ready" | "error" | "migration-pending";
type NewLead = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  source: string;
};
const EMPTY: NewLead = {
  name: "", email: "", phone: "", companyName: "",
  designation: "", source: "",
};
const SOURCE_CHOICES = [
  ["ALUMNI", "Alumni"], ["REFERRAL", "Referral"],
  ["LINKEDIN", "LinkedIn"], ["JOB_PORTAL", "Job portal"],
  ["EVENT", "Event or job fair"], ["COLD_OUTREACH", "Cold outreach"],
  ["COMPANY_REACHED_OUT", "Company reached out"],
] as const;
const STAGES = ["ALL", "NEW", "CONTACTED", "INVITED", "JOINED", "DRIVE_PLANNED", "RECRUITED", "NOT_NOW"] as const;

function friendlyError(status: number, payload: { error?: string }) {
  if (status === 503 && payload.error === "DB09_MIGRATIONS_PENDING") {
    return "Recruiter CRM is awaiting database verification. No lead data has been loaded.";
  }
  if (status === 409 && payload.error === "TPO_CRM_LEAD_DUPLICATE") {
    return "This contact already belongs to another recruiter lead in your college.";
  }
  if (status === 403) return "You do not have permission to manage recruiters in this college.";
  if (status === 401) return "Your session expired. Sign in again to continue.";
  return "The request failed. Check your connection and try again.";
}

const inputStyle = "min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
const buttonStyle = "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50";
const primaryStyle = "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

export function RecruiterLeadsWorkspace({
  collegeId,
  initialView = "table",
  initialAdd = false,
  initialCompany = "",
  initialFilters = {},
}: {
  collegeId: string;
  initialView?: "table" | "board" | "companies";
  initialAdd?: boolean;
  initialCompany?: string;
  initialFilters?: Partial<Record<"q"|"stage"|"owner"|"invite"|"status"|"source"|
    "company"|"reach"|"designation"|"nextFollowup"|"lastActivity"|"added",string>>;
}) {
  const [rows, setRows] = useState<Lead[]>([]);
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [visibleColumns,setVisibleColumns]=useState<EngageColumn[]>([...ENGAGE_DEFAULT_COLUMNS]);
  const [rosterSort,setRosterSort]=useState<EngageSort>("LAST_ACTIVITY");
  const [sortAscending,setSortAscending]=useState(false);
  useEffect(()=>{
    try{
      const stored=window.localStorage.getItem("tpo-engage-visible-columns-v1");
      if(stored)setVisibleColumns(normalizeEngageColumns(JSON.parse(stored)));
    }catch{ /* Optional browser preference, never blocks roster */ }
  },[]);
  function changeVisibleColumns(next:EngageColumn[]){
    const normalized=normalizeEngageColumns(next);
    setVisibleColumns(normalized);
    try{window.localStorage.setItem("tpo-engage-visible-columns-v1",JSON.stringify(normalized));}
    catch{ /* Browser storage can be disabled */ }
  }
  const [exportFeedback,setExportFeedback]=useState("");
  const [actionToast,setActionToast]=useState("");
  const [freshInvite,setFreshInvite]=useState<{leadId:string;url:string}|null>(null);
  const [invitingId,setInvitingId]=useState<string|null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState(initialFilters.q??"");
  const [filterOpen,setFilterOpen]=useState(false);
  const [ownerFilter,setOwnerFilter]=useState(initialFilters.owner??"ALL");
  const [inviteFilter,setInviteFilter]=useState(initialFilters.invite??"ALL");
  const [statusFilter,setStatusFilter]=useState(initialFilters.status??"ALL");
  const [sourceFilter,setSourceFilter]=useState(initialFilters.source??"ALL");
  const [companyFilter,setCompanyFilter]=useState(initialFilters.company??"ALL");
  const [designationFilter,setDesignationFilter]=useState(initialFilters.designation??"");
  const [reachFilter,setReachFilter]=useState(initialFilters.reach??"ALL");
  const [nextFilter,setNextFilter]=useState(initialFilters.nextFollowup??"ALL");
  const [activityFilter,setActivityFilter]=useState(initialFilters.lastActivity??"ALL");
  const [addedFilter,setAddedFilter]=useState(initialFilters.added??"ALL");
  const [stage, setStage] = useState<(typeof STAGES)[number]>(STAGES.includes(initialFilters.stage as (typeof STAGES)[number])?initialFilters.stage as (typeof STAGES)[number]:"ALL");
  const [need, setNeed] = useState<EngageNeed>("ALL");
  const [attention, setAttention] = useState<"ALL" | RecruiterAttentionChip>("ALL");
  const [view, setView] = useState<"table" | "board" | "companies">(initialView);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companySearch,setCompanySearch]=useState("");
  const [communication,setCommunication]=useState<Record<string,string>>({});
  const [communicationReady,setCommunicationReady]=useState(false);
  const [communicationError,setCommunicationError]=useState("");
  const [companyCommunicationFilter,setCompanyCommunicationFilter]=useState("ALL");
  const [companyContacts,setCompanyContacts]=useState("ALL");
  const [companyHistory,setCompanyHistory]=useState("ALL");
  const [companyAliases,setCompanyAliases]=useState(false);
  const [companiesPhase, setCompaniesPhase] = useState<Phase>("loading");
  const [companiesError, setCompaniesError] = useState("");
  const [adding, setAdding] = useState(initialAdd);
  const [form, setForm] = useState<NewLead>({
    ...EMPTY,
    companyName: initialCompany,
  });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setPhase("loading");
    setError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/leads?collegeId=" + encodeURIComponent(collegeId),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const data = await response.json() as { leads?: Lead[]; error?: string };
      if (!response.ok) {
        if (signal?.aborted) return;
        setPhase(response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
          ? "migration-pending" : "error");
        setError(friendlyError(response.status, data));
        return;
      }
      if (signal?.aborted) return;
      setRows(Array.isArray(data.leads) ? data.leads : []);
      setPhase("ready");
    } catch {
      if (signal?.aborted) return;
      setPhase("error");
      setError("Recruiter leads could not be loaded. Try again.");
    }
  }, [collegeId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const loadCompanies = useCallback(async (signal?: AbortSignal) => {
    setCompaniesPhase("loading");
    setCompaniesError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/companies?collegeId=" +
          encodeURIComponent(collegeId),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const data = await response.json() as {
        companies?: CompanySummary[];
        error?: string;
      };
      if (!response.ok) {
        if (signal?.aborted) return;
        setCompaniesPhase(
          response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
            ? "migration-pending"
            : "error",
        );
        setCompaniesError(friendlyError(response.status, data));
        return;
      }
      if (signal?.aborted) return;
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
      try{
       const states=await fetch("/api/placements/tpo/companies/communication",{
        cache:"no-store",credentials:"same-origin",signal,
       });
       if(states.ok){
        const snapshot=await states.json() as {ready:boolean;items:{company_key:string;status:string}[]};
        setCommunicationReady(snapshot.ready);
        setCommunication(Object.fromEntries((snapshot.items??[]).map(x=>[x.company_key,x.status])));
       }else setCommunicationReady(false);
      }catch{if(!signal?.aborted)setCommunicationReady(false);}
      setCompaniesPhase("ready");
    } catch {
      if (signal?.aborted) return;
      setCompaniesPhase("error");
      setCompaniesError("Companies could not be loaded. Try again.");
    }
  }, [collegeId]);

  useEffect(() => {
    if (view !== "companies") return;
    const controller = new AbortController();
    const timer = setTimeout(() => void loadCompanies(controller.signal), 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [view, loadCompanies]);

  function exportCompanies(){
   if(!visibleCompanies.length)return;
   const csv=tpoCompanyDirectoryCsv(visibleCompanies.map(company=>({
    name:company.name,contacts:company.contacts,drivesRan:company.drivesRan,
    acceptedOfferDrives:company.acceptedOfferDrives,studentsPlaced:company.studentsPlaced,
    communication:communication[company.key]??"NOT_CONTACTED",people:company.people??[],
   })));
   const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
   const anchor=document.createElement("a");anchor.href=url;anchor.download="companies.csv";
   document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
  }
  async function changeCompanyCommunication(key:string,status:string){
    if(!communicationReady)return;
    setCommunicationError("");
    const previous=communication[key];
    setCommunication(current=>({...current,[key]:status}));
    try{
     const response=await fetch("/api/placements/tpo/companies/communication",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({key,status}),
     });
     if(!response.ok)throw new Error("Couldn't save");
    }catch{
     setCommunication(current=>({...current,[key]:previous??"NOT_CONTACTED"}));
     setCommunicationError("Couldn't save. Retry this company status.");
    }
  }
  const visibleCompanies=useMemo(()=>companies.filter(company=>{
    const needle=companySearch.trim().toLowerCase();
    if(needle&&!([company.name,...(company.people??[]).map(person=>person.name)]
      .join(" ").toLowerCase().includes(needle)))return false;
    if(companyContacts==="HAS"&&company.contacts===0)return false;
    if(companyContacts==="NONE"&&company.contacts>0)return false;
    if(companyHistory==="HAS"&&company.drivesRan===0)return false;
    if(companyHistory==="NONE"&&company.drivesRan>0)return false;
    if(companyAliases&&company.aliases.length===0)return false;
    if(companyCommunicationFilter!=="ALL"&&
      (communication[company.key]??"NOT_CONTACTED")!==companyCommunicationFilter)return false;
    return true;
  }),[companies,companySearch,companyContacts,companyHistory,companyAliases,companyCommunicationFilter,communication]);
  const needCounts=useMemo(()=>engageNeedsCounts(rows),[rows]);
  const filters:EngageRosterFilters={stage,query,owner:ownerFilter,invite:inviteFilter,status:statusFilter,
    source:sourceFilter,company:companyFilter,designation:designationFilter,reach:reachFilter,
    nextFollowup:nextFilter,lastActivity:activityFilter,added:addedFilter};
  const visible=useMemo(()=>filterEngageRoster(rows,filters,lead=>
    matchesEngageNeed(lead,need)&&(attention==="ALL"||lead.chips?.includes(attention))),
    [rows,stage,query,need,attention,ownerFilter,inviteFilter,statusFilter,sourceFilter,
      companyFilter,designationFilter,reachFilter,nextFilter,activityFilter,addedFilter]);
  const sortedVisible=useMemo(()=>sortEngageRows(visible,rosterSort,sortAscending),
    [visible,rosterSort,sortAscending]);
  const filterChips=([
    {key:"stage",label:"Stage",value:stage},
    {key:"owner",label:"Owner",value:ownerFilter},
    {key:"invite",label:"Invite",value:inviteFilter},
    {key:"status",label:"Status",value:statusFilter},
    {key:"source",label:"Source",value:sourceFilter},
    {key:"company",label:"Company",value:companyFilter},
    {key:"designation",label:"Designation",value:designationFilter},
    {key:"reach",label:"Reach",value:reachFilter},
    {key:"nextFollowup",label:"Next follow-up",value:nextFilter},
    {key:"lastActivity",label:"Last activity",value:activityFilter},
    {key:"added",label:"Added",value:addedFilter},
    {key:"query",label:"Search",value:query},
  ] as const).filter(item=>Boolean(item.value)&&item.value!=="ALL");

  function exportRows(selection:"shown"|"selected",format:"csv"|"xlsx"){
    const chosen=selection==="selected"?visible.filter(row=>selectedIds.includes(row.id)):visible;
    if(chosen.length===0){setExportFeedback("Select recruiters first.");return;}
    const grid=recruiterTableExportGrid(chosen);
    const blob=format==="xlsx"?recruiterLeadsXlsx(grid.headers,grid.values):
      new Blob([recruiterTableExportCsv(chosen)],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;link.download="recruiter-leads"+(query.trim()?"-filtered":"")+"."+format;
    document.body.appendChild(link);link.click();link.remove();
    URL.revokeObjectURL(url);
    setExportFeedback(chosen.length+" recruiter leads exported to "+format.toUpperCase());
  }
  async function copyRows(){
    const chosen=selectedIds.length?visible.filter(row=>selectedIds.includes(row.id)):visible;
    if(!chosen.length){setExportFeedback("No recruiters to copy.");return;}
    try{await navigator.clipboard.writeText(recruiterTableExportTsv(chosen));
      setExportFeedback(chosen.length+" recruiter leads copied");
    }catch{setExportFeedback("Couldn't copy rows. Use Export CSV.");}
  }

  function updateFilter(kind:"owner"|"invite"|"status"|"source"|"query"|"company"|"designation"|
     "reach"|"nextFollowup"|"lastActivity"|"added"|"stage",value:string){
   const params=new URLSearchParams(window.location.search);
   if(value&&value!=="ALL")params.set(kind==="query"?"q":kind,value);
   else params.delete(kind==="query"?"q":kind);
   window.history.replaceState(null,"",window.location.pathname+(params.size?"?"+params.toString():""));
   if(kind==="stage")setStage(STAGES.includes(value as (typeof STAGES)[number])?value as (typeof STAGES)[number]:"ALL");
   else if(kind==="owner")setOwnerFilter(value);
   else if(kind==="invite")setInviteFilter(value);
   else if(kind==="status")setStatusFilter(value);
   else if(kind==="source")setSourceFilter(value);
   else if(kind==="company")setCompanyFilter(value);
   else if(kind==="designation")setDesignationFilter(value==="ALL"?"":value);
   else if(kind==="reach")setReachFilter(value);
   else if(kind==="nextFollowup")setNextFilter(value);
   else if(kind==="lastActivity")setActivityFilter(value);
   else if(kind==="added")setAddedFilter(value);
   else setQuery(value==="ALL"?"":value);
  }

  async function createInviteLink(lead:Lead){
    if(invitingId||lead.recruiterUserId||lead.unsubscribedAt||lead.manualStage==="NOT_NOW"||
      !lead.emailNorm||!lead.companyRelationshipId)return;
    if(lead.inviteSentAt&&!window.confirm("Make a new link? The old link stops working."))return;
    setInvitingId(lead.id);setFreshInvite(null);setActionToast("");
    try{
      const response=await fetch("/api/placements/tpo/leads/"+encodeURIComponent(lead.id)+"/invite",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({collegeId,sendEmail:false}),
      });
      if(!response.ok)throw new Error(response.status===503?
        "Recruiter invitations are unavailable until the database is ready.":
        "Couldn't create the invite link. Check this contact's access and email.");
      const payload=await response.json() as {invite?:{token:string}};
      if(!payload.invite?.token)throw new Error("Invite link was not returned.");
      const url=window.location.origin+"/recruiter-invite/"+encodeURIComponent(payload.invite.token);
      setFreshInvite({leadId:lead.id,url});
      setActionToast("Invite link created. Copy it now: for safety it is shown only once. No email has been sent.");
    }catch(error){setActionToast(error instanceof Error?error.message:"Couldn't create invite link");}
    finally{setInvitingId(null);}
  }
  async function copyInvite(){
    if(!freshInvite)return;
    try{await navigator.clipboard.writeText(freshInvite.url);setActionToast("Link copied");}
    catch{setActionToast("Couldn't copy. Select the link and copy it.");}
  }
  function field(name: keyof NewLead, value: string) {
    setForm(current => ({ ...current, [name]: value }));
    setDuplicate(null);
    setSaveError("");
  }

  async function checkContact() {
    const contact = form.email.trim() || form.phone.trim();
    if (!contact) return;
    setChecking(true);
    setSaveError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/leads/check?collegeId=" +
          encodeURIComponent(collegeId) + "&contact=" + encodeURIComponent(contact),
        { credentials: "same-origin", cache: "no-store" },
      );
      if (response.status === 204) {
        setDuplicate(null);
      } else {
        const data = await response.json() as { lead?: Lead; error?: string };
        if (!response.ok) throw new Error(friendlyError(response.status, data));
        setDuplicate(data.lead ?? null);
      }
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not check contact.");
    } finally {
      setChecking(false);
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !(form.email.trim() || form.phone.trim())) {
      setSaveError("Enter a name and at least one contact method.");
      return;
    }
    if (!window.confirm(
      "Create recruiter lead for " + form.name.trim() +
      (form.companyName.trim() ? " at " + form.companyName.trim() : "") +
      "? This saves a new college contact and records an auditable creation event.",
    )) return;

    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/placements/tpo/leads", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          lead: {
            collegeId,
            name: form.name.trim(),
            ...(form.email.trim() ? { email: form.email.trim() } : {}),
            ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
            ...(form.companyName.trim() ? { companyName: form.companyName.trim() } : {}),
            ...(form.designation.trim() ? { designation: form.designation.trim() } : {}),
            ...(form.source ? { source: form.source } : {}),
          },
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(friendlyError(response.status, data));
      setAdding(false);
      setActionToast("Recruiter lead added");
      setForm(EMPTY);
      setDuplicate(null);
      await load();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not create lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5" aria-label="Recruiter leads">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{TPO_OWNER_PAGE_COPY.recruiterLeads}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/tpo/recruiters/campaigns/preview" className={buttonStyle}>Preview campaign</Link>
          <Link href="/tpo/recruiters/campaigns" className={buttonStyle}>Campaign history</Link>
          <Link href="/tpo/follow-ups" className={buttonStyle}>
            Follow-ups Due
          </Link>
          <RecruiterLeadCsvImport onImported={() => void load()} />
          <button type="button" className={primaryStyle} disabled={phase !== "ready"}
            onClick={() => { setAdding(true); setForm(EMPTY); setSaveError(""); setDuplicate(null); }}>
            Add recruiter lead
          </button>
        </div>
      </div>

      {actionToast?<p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm">{actionToast}</p>:null}
      {phase !== "ready" && view!=="companies" ? (
        <div role={phase === "loading" ? "status" : "alert"}
          className="rounded-lg border border-border bg-surface p-5">
          {phase === "loading" ? "Loading recruiter leads…" : error}
          {phase === "error" ? (
            <button className={buttonStyle + " ml-3"} onClick={() => void load()}>Retry</button>
          ) : null}
        </div>
      ) : (
        <>
          <section aria-label="Needs doing" className="space-y-2 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">Needs doing</h2>
            <div className="flex flex-wrap gap-2">
              {([
                ["ALL","All contacts",needCounts.all],
                ["UNASSIGNED","Unassigned",needCounts.unassigned],
                ["NOT_CONTACTED","Not contacted",needCounts.notContacted],
              ] as const).map(([key,label,count])=><button key={key} type="button"
                aria-pressed={need===key} onClick={()=>setNeed(key)}
                className={need===key?"min-h-10 rounded-md bg-primary px-3 text-sm text-on-primary":"min-h-10 rounded-md border border-border px-3 text-sm text-body"}>
                  {label} ({count})
                </button>)}
              {(Object.keys(RECRUITER_ATTENTION_LABELS) as RecruiterAttentionChip[]).map(key => (
                <button key={key} type="button" aria-pressed={attention === key}
                  className={attention === key
                    ? "min-h-10 rounded-md bg-primary px-3 text-sm text-on-primary"
                    : "min-h-10 rounded-md border border-border px-3 text-sm text-body"}
                  onClick={() => setAttention(current => current === key ? "ALL" : key)}>
                  {RECRUITER_ATTENTION_LABELS[key]} ({rows.filter(row => row.chips?.includes(key)).length})
                </button>
              ))}
              <Link href="/tpo/follow-ups" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text">
                Follow-ups due
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </section>
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-4">
            <label className="min-w-48 flex-1 text-sm">
              Search name, company or contact
              <input className={inputStyle + " mt-1"} value={query} onChange={e => updateFilter("query",e.target.value)}
                placeholder="Search recruiter leads" />
            </label>
            <label className="min-w-40 text-sm">
              Stage
              <select className={inputStyle + " mt-1"} value={stage}
                onChange={e => updateFilter("stage",e.target.value)}>
                {STAGES.map(x => <option value={x} key={x}>{x === "ALL" ? "All stages" : RECRUITER_STAGE_LEGACY_LABELS[x]}</option>)}
              </select>
            </label>
            <label className="min-w-36 text-sm">
              View
              <select className={inputStyle + " mt-1"} value={view}
                onChange={e => {
                  if (e.target.value === "campaigns") {
                    window.location.assign("/tpo/recruiters?view=campaigns");
                  } else {
                    setView(e.target.value as typeof view);
                  }
                }}>
                <option value="table">Table</option><option value="board">Board</option><option value="companies">Companies ({companies.length})</option><option value="campaigns">Emails</option>
              </select>
            </label>
          </div>
          <div className="space-y-3">
            <button type="button" className={buttonStyle} onClick={()=>setFilterOpen(x=>!x)}
              aria-expanded={filterOpen} aria-controls="engage-filter-panel">
              Filters{filterChips.length?" ("+filterChips.length+")":""}
            </button>
            {filterChips.length?<div role="group" aria-label="Active recruiter filters"
              className="flex flex-wrap gap-2">
              {filterChips.map(chip=><button type="button" key={chip.key}
                className="rounded-full border border-border bg-primary-subtle px-3 py-1 text-xs text-body"
                title={"Clear "+chip.label+" filter"}
                onClick={()=>updateFilter(chip.key,"ALL")}>
                {chip.label}: {chip.value} ×
              </button>)}
            </div>:null}
            {filterOpen?<div id="engage-filter-panel" role="group" aria-label="Recruiter filters"
              className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm">Status
                <select className={inputStyle+" mt-1"} value={statusFilter}
                  onChange={e=>updateFilter("status",e.target.value)}>
                  {["ALL","JOINED","UNSUBSCRIBED","NOT_JOINED"].map(item=>
                   <option key={item} value={item}>{item==="ALL"?"All statuses":item.replaceAll("_"," ")}</option>)}
                </select>
              </label>
              <label className="text-sm">Owner
                <select className={inputStyle+" mt-1"} value={ownerFilter}
                  onChange={e=>updateFilter("owner",e.target.value)}>
                  <option value="ALL">All owners</option>
                  <option value="UNASSIGNED">Unassigned</option>
                  {[...new Set(rows.map(r=>r.ownerName).filter((name):name is string=>Boolean(name)))]
                   .sort().map(name=><option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="text-sm">Invite
                <select className={inputStyle+" mt-1"} value={inviteFilter}
                  onChange={e=>updateFilter("invite",e.target.value)}>
                  {["ALL","NOT_INVITED","SENT","OPENED","JOINED"].map(item=>
                   <option key={item} value={item}>{item==="ALL"?"All invites":item.replaceAll("_"," ")}</option>)}
                </select>
              </label>
              <label className="text-sm">Source
                <select className={inputStyle+" mt-1"} value={sourceFilter}
                  onChange={e=>updateFilter("source",e.target.value)}>
                  <option value="ALL">All sources</option>
                  {[...new Set(rows.map(r=>r.source).filter((name):name is string=>Boolean(name)))]
                   .sort().map(name=><option key={name} value={name}>{name.replaceAll("_"," ")}</option>)}
                </select>
              </label>
              <label className="text-sm">Company
                <select className={inputStyle+" mt-1"} value={companyFilter}
                  onChange={e=>updateFilter("company",e.target.value)}>
                  <option value="ALL">All companies</option>
                  {[...new Set(rows.map(row=>row.companyName).filter((name):name is string=>Boolean(name)))]
                    .sort().map(name=><option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="text-sm">Designation
                <input className={inputStyle+" mt-1"} value={designationFilter}
                  placeholder="Search designation" maxLength={100}
                  onChange={e=>updateFilter("designation",e.target.value)}/>
              </label>
              <label className="text-sm">Can be reached by
                <select className={inputStyle+" mt-1"} value={reachFilter}
                  onChange={e=>updateFilter("reach",e.target.value)}>
                  <option value="ALL">Any contact method</option>
                  <option value="EMAIL">Has an email</option>
                  <option value="PHONE">Has a phone</option>
                  <option value="NEITHER">Neither</option>
                </select>
              </label>
              <label className="text-sm">Next follow-up
                <select className={inputStyle+" mt-1"} value={nextFilter}
                  onChange={e=>updateFilter("nextFollowup",e.target.value)}>
                  <option value="ALL">Any date</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="TODAY">Today</option>
                  <option value="NEXT_7">In the next 7 days</option>
                  <option value="LATER">Later</option>
                  <option value="NONE">None set</option>
                </select>
              </label>
              <label className="text-sm">Last activity
                <select className={inputStyle+" mt-1"} value={activityFilter}
                  onChange={e=>updateFilter("lastActivity",e.target.value)}>
                  <option value="ALL">Any activity</option>
                  <option value="LAST_7">Last 7 days</option>
                  <option value="LAST_30">Last 30 days</option>
                  <option value="OVER_30">Over 30 days ago</option>
                  <option value="NEVER">Never</option>
                </select>
              </label>
              <label className="text-sm">Added
                <select className={inputStyle+" mt-1"} value={addedFilter}
                  onChange={e=>updateFilter("added",e.target.value)}>
                  <option value="ALL">Any date</option>
                  <option value="LAST_7">Last 7 days</option>
                  <option value="LAST_30">Last 30 days</option>
                  <option value="EARLIER">Earlier</option>
                </select>
              </label>
              <button type="button" className={buttonStyle} onClick={()=>{
                for(const key of ["owner","invite","status","source","query","company","designation",
                  "reach","nextFollowup","lastActivity","added"] as const)updateFilter(key,"ALL");
                updateFilter("stage","ALL");setAttention("ALL");setNeed("ALL");
              }}>Clear filters</button>
            </div>:null}
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {visible.length} of {rows.length} recruiter leads
          </p>
          {freshInvite ? (
            <section className="rounded-lg border border-border bg-surface p-3" aria-label="Fresh recruiter invite link">
              <p className="text-sm text-body">Copy this link now. It is shown only once. No email has been sent.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input readOnly aria-label="Invite link" value={freshInvite.url}
                  onFocus={event=>event.currentTarget.select()}
                  className={inputStyle+" min-w-0 flex-1"}/>
                <button type="button" className={buttonStyle} onClick={()=>void copyInvite()}>Copy</button>
                <button type="button" className={buttonStyle} onClick={()=>setFreshInvite(null)}>Hide link</button>
              </div>
            </section>
          ):null}
          {view !== "companies" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonStyle} onClick={()=>exportRows("shown","csv")}>Export CSV</button>
                <button type="button" className={buttonStyle} disabled={selectedIds.length===0}
                  onClick={()=>exportRows("selected","csv")}>Export selected ({selectedIds.length})</button>
                <button type="button" className={buttonStyle} onClick={()=>exportRows("shown","xlsx")}>Export Excel</button>
                <button type="button" className={buttonStyle} disabled={!visible.some(row=>selectedIds.includes(row.id))}
                  onClick={()=>exportRows("selected","xlsx")}>Export selected Excel</button>
                <button type="button" className={buttonStyle} onClick={()=>void copyRows()}>Copy rows</button>
                {selectedIds.length>0?<button type="button" className={buttonStyle}
                  onClick={()=>setSelectedIds([])}>Clear selection</button>:null}
                {exportFeedback?<p role="status" className="text-sm text-body">{exportFeedback}</p>:null}
              </div>
              <RecruiterSavedViewControls columns={visibleColumns}/>
              {selectedIds.length?<button type="button" className={buttonStyle}
                onClick={()=>window.location.assign("/tpo/recruiters/campaigns/new?selected="+encodeURIComponent(selectedIds.slice(0,100).join(",")))}>
                Send an email to selected ({Math.min(selectedIds.length,100)})
              </button>:null}
              <RecruiterBulkInviteControls collegeId={collegeId}
                rows={visible.filter(row=>selectedIds.includes(row.id))} onUpdated={()=>void load()}/>
              <RecruiterBulkStageControls rows={visible} onUpdated={() => void load()} />
              <RecruiterBulkOwnerControls rows={visible} onUpdated={() => void load()} />
            </div>
          ) : null}
          {view !== "companies" && visible.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground">
              {rows.length ? "No leads match your filters." : "No recruiter leads yet. Add your first contact."}
            </div>
          ) : view === "companies" ? (
            <section className="space-y-3" aria-label="Company filters">
              <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
                <label className="text-sm">Search company or people
                  <input type="search" className={inputStyle+" mt-1"} value={companySearch}
                    onChange={e=>setCompanySearch(e.target.value)} placeholder="Search companies"/>
                </label>
                <label className="text-sm">Contact
                  <select className={inputStyle+" mt-1"} value={companyContacts}
                    onChange={e=>setCompanyContacts(e.target.value)}>
                    <option value="ALL">All companies</option>
                    <option value="HAS">With contacts</option>
                    <option value="NONE">Without contacts</option>
                  </select>
                </label>
                <label className="text-sm">Drives that ran
                  <select className={inputStyle+" mt-1"} value={companyHistory}
                    onChange={e=>setCompanyHistory(e.target.value)}>
                    <option value="ALL">Any drive history</option>
                    <option value="HAS">Has drives</option>
                    <option value="NONE">No drives yet</option>
                  </select>
                </label>
                <label className="text-sm">Communication
                  <select className={inputStyle+" mt-1"} value={companyCommunicationFilter}
                    onChange={e=>setCompanyCommunicationFilter(e.target.value)}>
                    <option value="ALL">All communication</option>
                    <option value="NOT_CONTACTED">Not contacted</option>
                    <option value="EMAILED">Emailed</option>
                    <option value="REPLIED">Replied</option>
                    <option value="MEETING_SET">Meeting set</option>
                    <option value="NOT_INTERESTED">Not interested</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={companyAliases}
                    onChange={e=>setCompanyAliases(e.target.checked)}/>
                  Typed more than one way
                </label>
                <button type="button" className={buttonStyle} onClick={()=>{
                  setCompanySearch("");setCompanyContacts("ALL");setCompanyHistory("ALL");setCompanyAliases(false);setCompanyCommunicationFilter("ALL");
                }}>Clear company filters</button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="status" className="text-xs text-body">{visibleCompanies.length} of {companies.length} companies</p>
                <button type="button" disabled={visibleCompanies.length===0} onClick={exportCompanies}
                 className={buttonStyle}>Export companies CSV</button>
              </div>
              {!communicationReady?<p role="status" className="text-xs text-muted-foreground">Communication changes are unavailable until company status storage is registered.</p>:null}
              {communicationError?<p role="alert" className="text-sm text-warning">{communicationError}</p>:null}
              {companiesPhase !== "ready" ? (
                <p role="alert" className="text-sm text-body">
                  {companiesPhase==="loading"?"Loading companies…":companiesError}
                </p>
              ) : visibleCompanies.length===0 ? (
                <p className="rounded-lg border border-border bg-surface p-6 text-sm">
                  No companies match the current filters.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-secondary text-muted-foreground">
                      <tr>{["Company","Communication","People","Drives that ran","Accepted-offer drives","Students placed"].map(label=>
                        <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr>
                    </thead>
                    <tbody>{visibleCompanies.map(company=>(
                      <tr key={company.key} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <Link className="text-primary-text underline" href={"/tpo/companies?name="+encodeURIComponent(company.name)}>{company.name}</Link>
                          {company.aliases.length?<p className="text-xs text-muted-foreground">Also typed as {company.aliases.join(", ")}</p>:null}
                        </td>
                        <td className="px-4 py-3">
                          <select aria-label={"Communication for "+company.name}
                            className="min-h-10 rounded-md border border-border bg-surface px-2 text-sm"
                            value={communication[company.key]??"NOT_CONTACTED"}
                            disabled={!communicationReady}
                            onChange={e=>void changeCompanyCommunication(company.key,e.target.value)}>
                            <option value="NOT_CONTACTED">Not contacted</option>
                            <option value="EMAILED">Emailed</option>
                            <option value="REPLIED">Replied</option>
                            <option value="MEETING_SET">Meeting set</option>
                            <option value="NOT_INTERESTED">Not interested</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {company.people?.length?company.people.map(person=>
                            <Link key={person.id} className="mr-2 text-primary-text underline"
                              href={"/tpo/recruiters/"+encodeURIComponent(person.id)}>{person.name}</Link>):
                            <button type="button" className="text-primary-text underline"
                              onClick={()=>{setForm({...EMPTY,companyName:company.name});setAdding(true);}}>Add a contact</button>}
                        </td>
                        <td className="px-4 py-3">{company.drivesRan}</td>
                        <td className="px-4 py-3">{company.acceptedOfferDrives}</td>
                        <td className="px-4 py-3">{company.studentsPlaced??"Not enough data yet"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>
          ) : view === "table" ? (
            <div className="space-y-3">
              <RecruiterRosterDisplayControls columns={visibleColumns} onColumns={changeVisibleColumns}
                sort={rosterSort} onSort={setRosterSort} ascending={sortAscending} onAscending={setSortAscending}/>
              <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full text-left text-sm" tabIndex={0}
                onKeyDown={event=>{
                  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c"&&selectedIds.length){
                    const target=event.target;
                    if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement)return;
                    event.preventDefault();void copyRows();
                  }
                }}>
                <thead className="border-b border-border bg-surface-secondary text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      <input type="checkbox" aria-label="Select all visible recruiters"
                        checked={visible.length>0&&visible.every(row=>selectedIds.includes(row.id))}
                        onChange={event=>setSelectedIds(current=>event.target.checked?
                          [...new Set([...current,...visible.map(row=>row.id)])]:
                          current.filter(id=>!visible.some(row=>row.id===id)))}/>
                    </th>
                    {["Contact", "Company", "Status", "Stage", "Owner", "Last activity", "Next follow-up", "Invite", "Added", "Flags", "Source", "Email", "Phone", "Actions"].filter(x=>visibleColumns.includes(x as EngageColumn)).map(x =>
                    <th key={x} scope="col" className="px-4 py-3 font-semibold">{x}</th>)}</tr>
                </thead>
                <tbody>
                  {sortedVisible.map(lead => (
                    <tr key={lead.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <input type="checkbox" aria-label={"Select "+lead.name}
                          checked={selectedIds.includes(lead.id)}
                          onChange={event=>setSelectedIds(current=>event.target.checked?
                            [...new Set([...current,lead.id])]:current.filter(id=>id!==lead.id))}/>
                      </td>
                      <td style={{display:visibleColumns.includes("Contact")?undefined:"none"}} className="px-4 py-3 font-medium">
                        <Link className="text-primary-text underline-offset-2 hover:underline"
                          href={"/tpo/recruiters/" + encodeURIComponent(lead.id)}>{lead.name}</Link>
                      </td>
                      <td style={{display:visibleColumns.includes("Company")?undefined:"none"}} className="px-4 py-3">{lead.companyName || "—"}</td>
                      <td style={{display:visibleColumns.includes("Status")?undefined:"none"}} className="px-4 py-3">{lead.recruiterUserId?"Joined":lead.unsubscribedAt?"Unsubscribed":"Not joined"}</td>
                       <td style={{display:visibleColumns.includes("Stage")?undefined:"none"}} className="px-4 py-3">{RECRUITER_STAGE_LEGACY_LABELS[lead.stage]}</td>
                       <td style={{display:visibleColumns.includes("Owner")?undefined:"none"}} className="px-4 py-3">{lead.ownerName??"Unassigned"}</td>
                       <td style={{display:visibleColumns.includes("Last activity")?undefined:"none"}} className="px-4 py-3">{lead.lastActivityAt?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(lead.lastActivityAt)):"—"}</td>
                       <td style={{display:visibleColumns.includes("Next follow-up")?undefined:"none"}} className="px-4 py-3">{lead.nextFollowupAt?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(lead.nextFollowupAt)):"—"}</td>
                       <td style={{display:visibleColumns.includes("Invite")?undefined:"none"}} className="px-4 py-3">{lead.inviteStatus.replaceAll("_"," ")}</td>
                       <td style={{display:visibleColumns.includes("Added")?undefined:"none"}} className="px-4 py-3">{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(lead.createdAt))}</td>
                      <td style={{display:visibleColumns.includes("Flags")?undefined:"none"}} className="px-4 py-3">
                        {lead.chips?.map(chip => (
                          <span key={chip} className="mr-1 inline-block rounded border border-border px-1.5 py-0.5 text-xs">
                            {chip === "QUIET" ? `Quiet ${lead.quietDays}d` : RECRUITER_ATTENTION_LABELS[chip]}
                          </span>
                        ))}
                      </td>
                      <td style={{display:visibleColumns.includes("Source")?undefined:"none"}} className="px-4 py-3">{lead.source || "Manual"}</td>
                      <td style={{display:visibleColumns.includes("Email")?undefined:"none"}} className="px-4 py-3">{lead.emailNorm || "—"}</td>
                      <td style={{display:visibleColumns.includes("Phone")?undefined:"none"}} className="px-4 py-3">{lead.phoneNorm || "—"}</td>
                      <td style={{display:visibleColumns.includes("Actions")?undefined:"none"}} className="px-4 py-3">
                        {!lead.recruiterUserId?(
                          <button type="button" className={buttonStyle}
                            disabled={Boolean(invitingId)||!lead.emailNorm||!lead.companyRelationshipId||Boolean(lead.unsubscribedAt)}
                            onClick={()=>void createInviteLink(lead)}>
                            {lead.inviteSentAt?"Resend invite":"Invite"}
                          </button>
                        ):<span className="text-xs text-muted-foreground">Joined</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3" role="region" aria-label="Recruiter stage board">
              {(["NEW", "CONTACTED", "INVITED", "JOINED", "DRIVE_PLANNED", "RECRUITED", "NOT_NOW"] as const).map(column => (
                <section key={column} className="w-64 min-w-64 shrink-0 rounded-lg border border-border bg-surface p-4">
                  <h2 className="mb-3 font-semibold">{RECRUITER_STAGE_LEGACY_LABELS[column]} · {visible.filter(x => x.stage === column).length}</h2>
                  <div className="space-y-2">
                    {visible.filter(x => x.stage === column).slice(0, column==="RECRUITED"||column==="NOT_NOW"?5:50).map(lead => (
                      <div key={lead.id} className="rounded-md border border-border p-3 hover:bg-surface-secondary">
                        <Link href={"/tpo/recruiters/" + encodeURIComponent(lead.id)}
                          className="block text-primary-text underline-offset-2 hover:underline">
                        <span className="block font-medium">{lead.name}</span>
                        <span className="block text-sm text-muted-foreground">{lead.companyName || lead.emailNorm || lead.phoneNorm}</span>
                        </Link>
                        {!lead.recruiterUserId&&!lead.unsubscribedAt&&lead.manualStage!=="NOT_NOW"?
                         <button type="button" className={buttonStyle+" mt-2"}
                          disabled={Boolean(invitingId)||!lead.emailNorm||!lead.companyRelationshipId} onClick={()=>void createInviteLink(lead)}>Create invite link</button>:null}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <form role="dialog" aria-modal="true" aria-label="Add recruiter lead"
            onSubmit={e => void create(e)}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Add recruiter lead</h2>
              <button type="button" className={buttonStyle} onClick={() => setAdding(false)} disabled={saving}>Close</button>
            </div>
            <label className="block text-sm">Name *<input className={inputStyle + " mt-1"} required maxLength={150}
              value={form.name} onChange={e => field("name", e.target.value)} /></label>
            <label className="block text-sm">Email<input className={inputStyle + " mt-1"} type="email" maxLength={150}
              value={form.email} onChange={e => field("email", e.target.value)} /></label>
            <label className="block text-sm">Phone<input className={inputStyle + " mt-1"} type="tel" maxLength={30}
              value={form.phone} onChange={e => field("phone", e.target.value)} /></label>
            <button type="button" className={buttonStyle} disabled={checking || !(form.email || form.phone)}
              onClick={() => void checkContact()}>{checking ? "Checking…" : "Check for existing contact"}</button>
            {duplicate ? <p role="alert" className="text-sm text-destructive">
              Contact already exists: <Link className="underline" href={"/tpo/recruiters/" + duplicate.id}>{duplicate.name}</Link>.
            </p> : null}
            <label className="block text-sm">Company *<input className={inputStyle + " mt-1"} required maxLength={150}
              value={form.companyName} onChange={e => field("companyName", e.target.value)}
              list="known-engage-companies" placeholder="Company name" />
              <datalist id="known-engage-companies">
                {companies.map(company=><option key={company.key} value={company.name}/>)}
              </datalist>
              <span className="mt-1 block text-xs text-muted-foreground">
                Choose a company you've worked with, or type a new company name.
              </span>
            </label>
            <label className="block text-sm">Designation<input className={inputStyle + " mt-1"} maxLength={100}
              value={form.designation} onChange={e => field("designation", e.target.value)} /></label>
            <label className="block text-sm">Where did you find them?
              <select className={inputStyle + " mt-1"} value={form.source}
                onChange={e => field("source", e.target.value)}>
                <option value="">Added by hand</option>
                {SOURCE_CHOICES.map(([code,label]) => <option value={code} key={code}>{label}</option>)}
              </select>
            </label>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex justify-end">
              <button type="submit" className={primaryStyle}
                disabled={saving || checking || Boolean(duplicate)}>
                {saving ? "Creating…" : "Create recruiter lead"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
