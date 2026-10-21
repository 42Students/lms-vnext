"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { FilterChip } from "@/components/ui/filter-chip";
import { Dropdown } from "@/components/ui/dropdown";

import Link from "next/link";
import Image from "next/image";
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
import {ENGAGE_COLUMNS,ENGAGE_DEFAULT_COLUMNS,normalizeEngageColumns,sortEngageRows,
 type EngageColumn,type EngageSort} from "@/modules/placements/tpo-recruiter-table-view-model";
import { RecruiterBulkStageControls } from "./recruiter-bulk-stage-controls";
import { RecruiterBulkOwnerControls } from "./recruiter-bulk-owner-controls";
import {RecruiterBulkInviteControls} from "./recruiter-bulk-invite-controls";
import {RecruiterSavedViewControls} from "./recruiter-saved-view-controls";
import {RecruiterInlineStage} from "./recruiter-inline-stage";
import {RecruiterInlineOwner} from "./recruiter-inline-owner";
import {tpoCompanyDirectoryCsv} from "@/modules/placements/tpo-company-directory-export-model";
import {deriveLegacyCompanyCommunication} from "@/modules/placements/tpo-company-communication-legacy-model";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {Dialog} from "@/components/ui/dialog";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import type {TpoSpreadsheetGridProps} from "./tpo-spreadsheet-grid";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {GridWorkspace} from "./grid/grid-workspace";
import {legacyGridExportFilename} from "@/modules/placements/grid-export-filename";
import boardStyles from "./recruiter-board-theme.module.css";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";

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

type RosterGridRow=Lead & {drivesRan:number|null;studentsPlaced:number|null};
const recruiterDate=(value:string|null|undefined,withYear=false):string=>{
 if(!value)return "-";
 const parsed=new Date(value);
 if(Number.isNaN(parsed.getTime()))return "-";
 return new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",...(withYear?{year:"numeric" as const}:{})
 }).format(parsed);
};
function sourceLabel(code:string|null|undefined):string{
 if(!code)return "Manual";
 return SOURCE_CHOICES.find(([key])=>key===code)?.[1]??code.replaceAll("_"," ").toLowerCase().replace(/^./,letter=>letter.toUpperCase());
}
function inviteLabel(status:string):string{
 const labels:Record<string,string>={NOT_SENT:"Not sent",NOT_INVITED:"Not sent",SENT:"Sent",
  CLICKED:"Clicked",OPENED:"Clicked",JOINED:"Joined",BOUNCED:"Bounced"};
 return labels[status]??status.replaceAll("_"," ");
}
const RECRUITER_GRID_COLUMNS:readonly TpoGridColumn<RosterGridRow>[]=[
 {key:"Contact",label:"Contact",read:lead=>(lead.name||"Unnamed contact")+
 (lead.designation?" · "+lead.designation:"")},
 {key:"Status",label:"Status",read:lead=>lead.recruiterUserId?"Joined":lead.unsubscribedAt?"Unsubscribed":"Not joined"},
 {key:"Stage",label:"Stage",read:lead=>RECRUITER_STAGE_LEGACY_LABELS[lead.stage]},
 {key:"Company",label:"Company",read:lead=>lead.companyName||"Not set"},
  {key:"Designation",label:"Designation",read:lead=>lead.designation||"-"},
 {key:"Email",label:"Email",read:lead=>lead.emailNorm},
 {key:"Phone",label:"Phone",read:lead=>lead.phoneNorm},
 {key:"Flags",label:"Flags",read:lead=>lead.chips.map(chip=>chip==="QUIET"?
 "Quiet "+lead.quietDays+"d":RECRUITER_ATTENTION_LABELS[chip]).join(" · ")||"-"},
 {key:"Owner",label:"Owner",read:lead=>lead.ownerName||"Unassigned"},
 {key:"Last activity",label:"Last activity",read:lead=>recruiterDate(lead.lastActivityAt),
  sortKind:"date",sortValue:lead=>lead.lastActivityAt?new Date(lead.lastActivityAt).getTime():null},
 {key:"Next follow-up",label:"Next follow-up",read:lead=>recruiterDate(lead.nextFollowupAt),
  sortKind:"date",sortValue:lead=>lead.nextFollowupAt?new Date(lead.nextFollowupAt).getTime():null},
 {key:"Invite",label:"Invite",read:lead=>inviteLabel(lead.inviteStatus)},
 {key:"Added",label:"Added",read:lead=>recruiterDate(lead.createdAt,true),
  sortKind:"date",sortValue:lead=>new Date(lead.createdAt).getTime()},
 {key:"Came from",label:"Came from",read:lead=>sourceLabel(lead.source)},
 {key:"Company drives",label:"Company drives",read:lead=>lead.drivesRan,sortKind:"number"},
  {key:"Students placed",label:"Students placed",read:lead=>lead.studentsPlaced??"-",sortKind:"number"},
 {key:"Actions",label:"Actions",read:lead=>lead.recruiterUserId?"Joined":"Invite"},
];

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
/** The company tab is a distinct authorized sheet, not the global company directory. */
const EngageCompanyTpoGrid=dynamic<TpoSpreadsheetGridProps<CompanySummary>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<CompanySummary>),
 {ssr:false,loading:()=> <p role="status" className="py-4 text-sm text-muted-foreground leading-[22px]">Loading company contacts…</p>},
);

type Phase = "loading" | "ready" | "error" | "migration-pending";
/** Quartz table is browser-only; all rows remain college-scoped page data. */
const RecruiterTpoGrid=dynamic<TpoSpreadsheetGridProps<RosterGridRow>>(
 ()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<RosterGridRow>),
 {ssr:false,loading:()=> <p role="status" className="py-4 text-sm text-muted-foreground leading-[22px]">Loading recruiter spreadsheet…</p>},
);

type NewLead = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  source: string;
  followupDate: string;
  followupNote: string;
};
function followupInstant(when:string):Date|null{
 if(!when)return null;
 const instant=new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)?
  when+":00+05:30":when+"T09:00:00+05:30");
 return Number.isFinite(instant.getTime())?instant:null;
}
const EMPTY: NewLead = {
  name: "", email: "", phone: "", companyName: "",
  designation: "", source: "", followupDate: "", followupNote: "",
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

const inputStyle = "min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-foreground md:min-h-9";
const buttonStyle = "inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] disabled:cursor-not-allowed disabled:opacity-50";
const primaryStyle = "inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 py-2 text-sm font-[650] text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

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
    "company"|"reach"|"designation"|"nextFollowup"|"lastActivity"|"added"|"need"|"attention"|"drives",string>>;
}) {
  const router=useRouter();
  const [rows, setRows] = useState<Lead[]>([]);
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [visibleColumns,setVisibleColumns]=useState<EngageColumn[]>([...ENGAGE_DEFAULT_COLUMNS]);
  const [rosterSort,setRosterSort]=useState<EngageSort>("LAST_ACTIVITY");
  const [sortAscending,setSortAscending]=useState(false);
  function changeRosterSort(value:EngageSort){
    setRosterSort(value);
    try{window.localStorage.setItem("tpo-engage-sort-v1",JSON.stringify({sort:value,ascending:sortAscending}));}
    catch{/* Browser storage is optional. */}
  }
  function changeSortAscending(value:boolean){
    setSortAscending(value);
    try{window.localStorage.setItem("tpo-engage-sort-v1",JSON.stringify({sort:rosterSort,ascending:value}));}
    catch{/* Browser storage is optional. */}
  }

  useEffect(()=>{
    let live=true;
    void Promise.resolve().then(()=>{
      if(!live)return;
      try{
        const saved=window.localStorage.getItem("tpo-engage-sort-v1");
        if(!saved)return;
        const value=JSON.parse(saved) as {sort?:string;ascending?:boolean};
        if(["LAST_ACTIVITY","NEXT_FOLLOWUP","ADDED","NAME","DRIVES"].includes(value.sort??""))
          setRosterSort(value.sort as EngageSort);
        if(typeof value.ascending==="boolean")setSortAscending(value.ascending);
      }catch{ /* Browser storage is optional. */ }
    });
    return ()=>{live=false;};
  },[]);
  useEffect(()=>{
    let live=true;
    void Promise.resolve().then(()=>{
      if(!live)return;
      try{
        const stored=window.localStorage.getItem("tpo-engage-visible-columns-v1");
        if(stored)setVisibleColumns(normalizeEngageColumns(JSON.parse(stored)));
      }catch{ /* Optional browser preference, never blocks roster */ }
    });
    return ()=>{live=false;};
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
  const [draggedBoardId,setDraggedBoardId]=useState<string|null>(null);
  const [boardMoving,setBoardMoving]=useState(false);
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
  const [driveFilter,setDriveFilter]=useState(initialFilters.drives??"ALL");
  const [placedFilter,setPlacedFilter]=useState("ALL");
  const sourceOptions=useMemo(()=>{
    const known=new Map<string,string>(SOURCE_CHOICES.map(([key,label])=>[key,label]));
    for(const row of rows)if(row.source&&!known.has(row.source))known.set(row.source,sourceLabel(row.source));
    return [...known.entries()];
  },[rows]);
  const [designationFilter,setDesignationFilter]=useState(initialFilters.designation??"");
  const [reachFilter,setReachFilter]=useState(initialFilters.reach??"ALL");
  const [nextFilter,setNextFilter]=useState(initialFilters.nextFollowup??"ALL");
  const [activityFilter,setActivityFilter]=useState(initialFilters.lastActivity??"ALL");
  const [addedFilter,setAddedFilter]=useState(initialFilters.added??"ALL");
  const [stage, setStage] = useState<(typeof STAGES)[number]>(STAGES.includes(initialFilters.stage as (typeof STAGES)[number])?initialFilters.stage as (typeof STAGES)[number]:"ALL");
  const [need, setNeed] = useState<EngageNeed>(["ALL","UNASSIGNED","NOT_CONTACTED"].includes(initialFilters.need??"")?initialFilters.need as EngageNeed:"ALL");
  const [attention, setAttention] = useState<"ALL" | RecruiterAttentionChip>(initialFilters.attention&&initialFilters.attention in RECRUITER_ATTENTION_LABELS?initialFilters.attention as RecruiterAttentionChip:"ALL");
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
  const [confirmation,setConfirmation]=useState<{kind:"CONTACTED"|"INVITE"|"DISCARD";leadId?:string}|null>(null);
  const createDialogRef=useRef<HTMLFormElement>(null);
  const createNameRef=useRef<HTMLInputElement>(null);
  const createLaunchRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(adding)createNameRef.current?.focus();},[adding]);
  const [form, setForm] = useState<NewLead>({
    ...EMPTY,
    companyName: initialCompany,
  });
  const [saveError, setSaveError] = useState("");
  const [reviewingCreate,setReviewingCreate]=useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  const [checking, setChecking] = useState(false);
  const contactCheckSeq=useRef(0);

  const leadsSnapshotReady=useRef(false);
  const companiesSnapshotReady=useRef(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    if(!leadsSnapshotReady.current)setPhase("loading");
    setError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/leads?collegeId=" + encodeURIComponent(collegeId),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const data = await response.json() as { leads?: Lead[]; error?: string };
      if (!response.ok) {
        if (signal?.aborted) return;
        setPhase(leadsSnapshotReady.current?"ready":response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
          ? "migration-pending" : "error");
        setError(friendlyError(response.status, data));
        return;
      }
      if (signal?.aborted) return;
      setRows(Array.isArray(data.leads) ? data.leads : []);
      leadsSnapshotReady.current=true;
      setPhase("ready");
    } catch {
      if (signal?.aborted) return;
      setPhase(leadsSnapshotReady.current?"ready":"error");
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
    if(!companiesSnapshotReady.current)setCompaniesPhase("loading");
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
          companiesSnapshotReady.current?"ready":response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
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
      companiesSnapshotReady.current=true;
      setCompaniesPhase("ready");
    } catch {
      if (signal?.aborted) return;
      setCompaniesPhase(companiesSnapshotReady.current?"ready":"error");
      setCompaniesError("Companies could not be loaded. Try again.");
    }
  }, [collegeId]);

  useEffect(() => {
    // Company count is shown in every Engage tab, including a brand-new roster.
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
  const visibleCompanies=companies.filter(company=>{
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
  });
  const engageCompanyColumns:readonly TpoGridColumn<CompanySummary>[]=[
    {key:"Company",label:"Company",read:company=>company.name+
      (company.aliases.length?" · Also "+company.aliases.length+" other spellings":"")},
    {key:"Communication",label:"Communication",read:company=>
      communication[company.key]??deriveLegacyCompanyCommunication(company.drivesRan,
        rows.filter(lead=>company.people.some(person=>person.id===lead.id)))},
    {key:"People",label:"People",read:company=>company.people.map(person=>person.name).join(", ")||"No contacts"},
    {key:"Drives that ran",label:"Drives that ran",read:company=>company.drivesRan,sortKind:"number"},
    {key:"Accepted-offer drives",label:"Accepted-offer drives",read:company=>company.acceptedOfferDrives,sortKind:"number"},
    {key:"Students placed",label:"Students placed",read:company=>company.studentsPlaced??"Not enough data yet",sortKind:"number"},
  ];
  const leadDriveCounts=useMemo(()=>new Map(companies.flatMap(company=>
    company.people.map(person=>[person.id,company.drivesRan] as const))),[companies]);
  const leadPlacementCounts=useMemo(()=>new Map(companies.flatMap(company=>
    company.people.map(person=>[person.id,company.studentsPlaced] as const))),[companies]);
  const rosterRows=useMemo(()=>rows.map(row=>({
    ...row,drivesRan:companiesPhase==="ready"?leadDriveCounts.get(row.id)??null:null,
    studentsPlaced:companiesPhase==="ready"?leadPlacementCounts.get(row.id)??null:null,
  })),[rows,leadDriveCounts,leadPlacementCounts,companiesPhase]);
  const needCounts=useMemo(()=>engageNeedsCounts(rows),[rows]);
  const filters:EngageRosterFilters={stage,query,owner:ownerFilter,invite:inviteFilter,status:statusFilter,
    source:sourceFilter,company:companyFilter,designation:designationFilter,reach:reachFilter,
    nextFollowup:nextFilter,lastActivity:activityFilter,added:addedFilter,drives:driveFilter};
  const visible=useMemo(()=>filterEngageRoster(rosterRows,filters,lead=>
    matchesEngageNeed(lead,need)&&(attention==="ALL"||lead.chips?.includes(attention))&&
      (placedFilter==="ALL"||
       (lead.studentsPlaced!==null&&(placedFilter==="NONE"?lead.studentsPlaced===0:
        placedFilter==="ONE_TWO"?lead.studentsPlaced>=1&&lead.studentsPlaced<=2:
        placedFilter==="THREE_PLUS"?lead.studentsPlaced>=3:true)))),
    [rosterRows,stage,query,need,attention,ownerFilter,inviteFilter,statusFilter,
      companyFilter,designationFilter,reachFilter,nextFilter,activityFilter,addedFilter,driveFilter,placedFilter]);
  const sortedVisible=useMemo(()=>sortEngageRows(visible,rosterSort,sortAscending),
    [visible,rosterSort,sortAscending]);
  const filterChips=([
    {key:"stage",label:"Stage",value:stage},
    {key:"need",label:"Needs doing",value:need},
    {key:"attention",label:"Needs attention",value:attention},
    {key:"owner",label:"Owner",value:ownerFilter},
    {key:"invite",label:"Invite",value:inviteFilter},
    {key:"status",label:"Status",value:statusFilter},
    {key:"source",label:"Source",value:sourceFilter},
    {key:"company",label:"Company",value:companyFilter},
    {key:"drives",label:"Drives that ran",value:driveFilter},
    {key:"placed",label:"Students placed",value:placedFilter},
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
    const grid=recruiterTableExportGrid(chosen,visibleColumns);
    const blob=format==="xlsx"?recruiterLeadsXlsx(grid.headers,grid.values):
      new Blob([recruiterTableExportCsv(chosen,visibleColumns)],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;link.download=legacyGridExportFilename("recruiter-leads",format);
    document.body.appendChild(link);link.click();link.remove();
    URL.revokeObjectURL(url);
    setExportFeedback(chosen.length+" recruiter leads exported to "+format.toUpperCase());
  }
  async function copyRows(){
    const chosen=selectedIds.length?visible.filter(row=>selectedIds.includes(row.id)):visible;
    if(!chosen.length){setExportFeedback("No recruiters to copy.");return;}
    try{await navigator.clipboard.writeText(recruiterTableExportTsv(chosen,visibleColumns));
      setExportFeedback(chosen.length+" recruiter leads copied");
    }catch{setExportFeedback("Couldn't copy rows. Use Export CSV.");}
  }

  function updateFilter(kind:"owner"|"invite"|"status"|"source"|"query"|"company"|"designation"|
     "reach"|"nextFollowup"|"lastActivity"|"added"|"stage"|"need"|"attention"|"drives",value:string){
   const params=new URLSearchParams(window.location.search);
   if(kind==="nextFollowup")params.delete("due");
   if(value&&value!=="ALL")params.set(kind==="query"?"q":kind,value);
   else params.delete(kind==="query"?"q":kind);
   window.history.replaceState(null,"",window.location.pathname+(params.size?"?"+params.toString():""));
   if(kind==="stage")setStage(STAGES.includes(value as (typeof STAGES)[number])?value as (typeof STAGES)[number]:"ALL");
   else if(kind==="owner")setOwnerFilter(value);
   else if(kind==="invite")setInviteFilter(value);
   else if(kind==="status")setStatusFilter(value);
   else if(kind==="source")setSourceFilter(value);
   else if(kind==="company")setCompanyFilter(value);
   else if(kind==="drives")setDriveFilter(value);
   else if(kind==="designation")setDesignationFilter(value==="ALL"?"":value);
   else if(kind==="reach")setReachFilter(value);
   else if(kind==="nextFollowup")setNextFilter(value);
   else if(kind==="lastActivity")setActivityFilter(value);
   else if(kind==="added")setAddedFilter(value);
   else if(kind==="need")setNeed(["ALL","UNASSIGNED","NOT_CONTACTED"].includes(value)?value as EngageNeed:"ALL");
   else if(kind==="attention")setAttention(value in RECRUITER_ATTENTION_LABELS?value as RecruiterAttentionChip:"ALL");
   else setQuery(value==="ALL"?"":value);
  }

  async function moveBoardLeadToContacted(leadId:string,confirmed=false){
    const lead=rows.find(row=>row.id===leadId);
    if(!lead||lead.manualStage!=="NEW"||boardMoving)return;
    if(!confirmed){setConfirmation({kind:"CONTACTED",leadId});return;}
    setBoardMoving(true);setActionToast("");
    try{
      const response=await fetch("/api/placements/tpo/leads/bulk-stage",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({confirmed:true,action:"CONTACTED",
          selections:[{id:lead.id,expectedStage:"NEW"}]}),
      });
      const data=await response.json() as {results?:{status:string;reason:string|null}[]};
      if(!response.ok||data.results?.[0]?.status!=="updated")
        throw new Error(data.results?.[0]?.reason??"The contact changed. Reload before trying again.");
      setActionToast(lead.name+" moved to Contacted.");
      await load();
    }catch(e){setActionToast(e instanceof Error?e.message:"Could not move this recruiter.");}
    finally{setBoardMoving(false);setDraggedBoardId(null);}
  }

  async function createInviteLink(lead:Lead,confirmed=false){
    if(invitingId||lead.recruiterUserId||lead.unsubscribedAt||
      !lead.emailNorm||!lead.companyRelationshipId)return;
    if(lead.inviteSentAt&&!confirmed){setConfirmation({kind:"INVITE",leadId:lead.id});return;}
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
    contactCheckSeq.current++;
    setChecking(false);
    setForm(current => ({ ...current, [name]: value }));
    setDuplicate(null);
    setSaveError("");setReviewingCreate(false);
  }

  async function checkContact() {
    const contact = form.email.trim() || form.phone.trim();
    if (!contact) return;
    const sequence=++contactCheckSeq.current;
    setChecking(true);
    setSaveError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/leads/check?collegeId=" +
          encodeURIComponent(collegeId) + "&contact=" + encodeURIComponent(contact),
        { credentials: "same-origin", cache: "no-store" },
      );
      if(sequence!==contactCheckSeq.current)return;
      if (response.status === 204) {
        setDuplicate(null);
      } else {
        const data = await response.json() as { lead?: Lead; error?: string };
        if(sequence!==contactCheckSeq.current)return;
        if (!response.ok) throw new Error(friendlyError(response.status, data));
        setDuplicate(data.lead ?? null);
      }
    } catch (cause) {
      if(sequence===contactCheckSeq.current)setSaveError(cause instanceof Error ? cause.message : "Could not check contact.");
    } finally {
      if(sequence===contactCheckSeq.current)setChecking(false);
    }
  }

  function closeAddDialog(confirmed=false) {
    if(saving)return;
    const dirty=Object.entries(form).some(([key,value])=>value.trim()!==
      (key==="companyName"?initialCompany.trim():""));
    if(dirty&&!confirmed){setConfirmation({kind:"DISCARD"});return;}
    contactCheckSeq.current++;
    setChecking(false);
    setAdding(false);setDuplicate(null);setSaveError("");setReviewingCreate(false);
    createLaunchRef.current?.focus();
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(checking||saving)return;
    const sequence=++contactCheckSeq.current;
    if(!form.name.trim()){setSaveError("Name is required");createNameRef.current?.focus();return;}
    if(!(form.email.trim()||form.phone.trim())){setSaveError("Enter at least one contact method.");return;}
    if(form.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())){
      setSaveError("Enter a valid email");return;
    }
    if(form.phone.trim()&&!/^\+?[\d() .-]{7,30}$/.test(form.phone.trim())){
      setSaveError("Enter a phone number");return;
    }
    if (form.companyName.trim().length < 2) {
      setSaveError("Company is required.");
      return;
    }
    // Preflight every contact on submit. Database uniqueness remains authoritative.
    setChecking(true);setSaveError("");setDuplicate(null);
    try {
      const contacts=[...new Set([form.email.trim(),form.phone.trim()].filter(Boolean))];
      for(const contact of contacts){
        const result=await fetch("/api/placements/tpo/leads/check?collegeId="+
          encodeURIComponent(collegeId)+"&contact="+encodeURIComponent(contact),{
          credentials:"same-origin",cache:"no-store",
        });
        if(sequence!==contactCheckSeq.current)return;
        if(result.status===204)continue;
        const data=await result.json() as {lead?:Lead;error?:string};
        if(sequence!==contactCheckSeq.current)return;
        if(!result.ok)throw new Error(friendlyError(result.status,data));
        if(data.lead){
          setDuplicate(data.lead);
          setSaveError("This contact is already a recruiter. Open the existing recruiter instead.");
          return;
        }
      }
    }catch(cause){
      if(sequence===contactCheckSeq.current)setSaveError(cause instanceof Error?cause.message:"Could not check this contact.");
      return;
    }finally{if(sequence===contactCheckSeq.current)setChecking(false);}
    if(sequence!==contactCheckSeq.current)return;
    if(form.followupDate&&(!followupInstant(form.followupDate)||
     followupInstant(form.followupDate)!.getTime()<=Date.now())){
      setSaveError("Choose a future follow-up time (IST).");return;
    }
    if(!reviewingCreate){setReviewingCreate(true);return;}
    if(sequence!==contactCheckSeq.current)return;

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
            ...(form.followupDate ? {followup:{dueAt:followupInstant(form.followupDate)!.toISOString(),note:form.followupNote.trim()}} : {}),
          },
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(friendlyError(response.status, data));
      setAdding(false);setReviewingCreate(false);
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
    <section className="min-w-0 space-y-4" aria-label="Recruiter leads">
      <PageHeader
        title={TPO_OWNER_PAGE_COPY.recruiterLeads}
        description="Manage company relationships, follow-ups, and placement drives."
        actions={
          <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center">
            <RecruiterLeadCsvImport onImported={()=>void load()} />
            <Button variant="primary" ref={createLaunchRef} type="button" className={primaryStyle} disabled={phase!=="ready"}
              onClick={()=>{setAdding(true);setForm(EMPTY);setSaveError("");setDuplicate(null);setReviewingCreate(false);}}>
              <Image src="/assets/images/common/plus.svg" width={16} height={16} alt="" aria-hidden="true" className="mr-2 inline-block"/>
              Add recruiter lead
            </Button>
            <Dropdown mobileSheet align="end" label="More recruiter actions" trigger="More ···">
              <nav aria-label="Recruiter workspace links" className="flex min-w-48 flex-col gap-1">
                <Link href="/tpo/recruiters/campaigns/preview" className={buttonStyle}>Preview campaign</Link>
                <Link href="/tpo/recruiters/campaigns" className={buttonStyle}>Campaign history</Link>
                <Link href="/tpo/follow-ups" className={buttonStyle}>Follow-ups Due</Link>
              </nav>
            </Dropdown>
          </div>
        }
      />

      {phase==="ready"&&error?<div role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">
        {error} Showing the last recruiter list we loaded.
        <Button variant="secondary" type="button" className={buttonStyle+" ml-2"} onClick={()=>void load()}>Retry</Button>
      </div>:null}
      {companiesPhase==="ready"&&companiesError?<div role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">
        {companiesError} Showing the last company list we loaded.
        <Button variant="secondary" type="button" className={buttonStyle+" ml-2"} onClick={()=>void loadCompanies()}>Retry companies</Button>
      </div>:null}
      {actionToast?<p role="status" className="border-l-2 border-primary bg-primary-subtle px-3 py-3 text-sm leading-[22px]">{actionToast}</p>:null}
      {phase !== "ready" && view!=="companies" ? (
        <div role={phase === "loading" ? "status" : "alert"}
          className="border-l-2 border-warning bg-warning-subtle px-4 py-3">
          {phase === "loading" ? "Loading recruiter leads…" : error}
          {phase === "error" ? (
            <Button variant="secondary" className={buttonStyle + " ml-3"} onClick={() => void load()}>Retry</Button>
          ) : null}
        </div>
      ) : (
        <>
          <section aria-label="Needs doing" className="space-y-2 border-b border-border py-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              {([
                ["OVERDUE","Follow-ups due",rows.filter(row=>row.chips?.includes("OVERDUE")).length],
                ["NO_NEXT_STEP","No next step",rows.filter(row=>row.chips?.includes("NO_NEXT_STEP")).length],
                ["QUIET","Gone quiet",rows.filter(row=>row.chips?.includes("QUIET")).length],
              ] as const).map(([key,label,count])=>
                <FilterChip key={key} type="button" data-testid={"needs-"+key.toLowerCase().replaceAll("_","-")}
                  aria-pressed={attention===key} onClick={()=>updateFilter("attention",attention===key?"ALL":key)}>
                  {label} · <strong>{count}</strong>
                </FilterChip>)}
              <FilterChip type="button" data-testid="needs-unassigned" aria-pressed={need==="UNASSIGNED"}
                onClick={()=>updateFilter("need",need==="UNASSIGNED"?"ALL":"UNASSIGNED")}>Unassigned · <strong>{needCounts.unassigned}</strong></FilterChip>
            </div>
            <Link className="inline-flex min-h-11 items-center text-sm text-link underline md:min-h-9"
              href="/tpo/settings/recruiters">{rows.filter(row=>Boolean(row.recruiterUserId)).length} recruiters with access</Link>
          </section>
          <div className="grid min-w-0 gap-3 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_minmax(10rem,auto)]">
            <label className="min-w-48 flex-1 text-sm">
              Search name, company or contact
              <Input className={inputStyle + " mt-1.5 min-w-0"} value={query} onChange={e => updateFilter("query",e.target.value)}
                placeholder="Search recruiter leads" />
            </label>
            <label className="min-w-40 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Stage
              <Select className={inputStyle + " mt-1.5 min-w-0"} value={stage}
                onChange={e => updateFilter("stage",e.target.value)}>
                {STAGES.map(x => <option value={x} key={x}>{x === "ALL" ? "All stages" : RECRUITER_STAGE_LEGACY_LABELS[x]}</option>)}
              </Select>
            </label>
            <div className="min-w-0 md:col-span-2"><Tabs ariaLabel="Engage views" controlledOnly renderPanel={false} value={view}
              items={[{value:"table",label:"Table"},{value:"board",label:"Board"},
                {value:"companies",label:"Companies",count:companies.length},{value:"campaigns",label:"Emails"}]}
              onValueChange={next=>{
                const params=new URLSearchParams(window.location.search);
                if(next==="campaigns"){params.set("view","campaigns");
                  window.location.assign("/tpo/recruiters?"+params.toString());return;}
                if(next==="table")params.delete("view");else params.set("view",next);
                window.history.replaceState(null,"",window.location.pathname+(params.size?"?"+params.toString():""));
                setView(next as "table"|"board"|"companies");
              }}/></div>
          </div>
          <div className="space-y-3">
            {view!=="table"?<Button variant="secondary" type="button" className={buttonStyle} onClick={()=>setFilterOpen(x=>!x)}
              aria-expanded={filterOpen} aria-controls="engage-filter-panel">
              Filters{filterChips.length?" ("+filterChips.length+")":""}
            </Button>:null}
            {filterChips.length?<div role="group" aria-label="Active recruiter filters"
              className="flex flex-wrap gap-2">
              {filterChips.map(chip=><FilterChip type="button" key={chip.key}
                
                title={"Clear "+chip.label+" filter"}
                aria-label={"Clear "+chip.label+" filter"} aria-pressed={true}
                onClick={()=>updateFilter(chip.key,"ALL")}>
                {chip.label}: {chip.value} ×
              </FilterChip>)}
            </div>:null}
            {filterOpen?<div id="engage-filter-panel" role="group" aria-label="Recruiter filters"
              className="grid min-w-0 gap-3 border-b border-border py-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm">Status
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={statusFilter}
                  onChange={e=>updateFilter("status",e.target.value)}>
                  {["ALL","JOINED","UNSUBSCRIBED","NOT_JOINED"].map(item=>
                   <option key={item} value={item}>{item==="ALL"?"All statuses":item.replaceAll("_"," ")}</option>)}
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Owner
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={ownerFilter}
                  onChange={e=>updateFilter("owner",e.target.value)}>
                  <option value="ALL">All owners</option>
                  <option value="UNASSIGNED">Unassigned</option>
                  {[...new Set(rows.map(r=>r.ownerName).filter((name):name is string=>Boolean(name)))]
                   .sort().map(name=><option key={name} value={name}>{name}</option>)}
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Invite
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={inviteFilter}
                  onChange={e=>updateFilter("invite",e.target.value)}>
                  {["ALL","NOT_INVITED","SENT","OPENED","BOUNCED","JOINED"].map(item=>
                   <option key={item} value={item}>{item==="ALL"?"All invites":inviteLabel(item)}</option>)}
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Source
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={sourceFilter}
                  onChange={e=>updateFilter("source",e.target.value)}>
                  <option value="ALL">All sources</option>
                  {[...new Set(rows.map(r=>r.source).filter((name):name is string=>Boolean(name)))]
                   .sort().map(name=><option key={name} value={name}>{name.replaceAll("_"," ")}</option>)}
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={companyFilter}
                  onChange={e=>updateFilter("company",e.target.value)}>
                  <option value="ALL">All companies</option>
                  {[...new Set(rows.map(row=>row.companyName).filter((name):name is string=>Boolean(name)))]
                    .sort().map(name=><option key={name} value={name}>{name}</option>)}
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Drives that ran
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={driveFilter}
                  onChange={e=>updateFilter("drives",e.target.value)}>
                  <option value="ALL">Any drive count</option>
                  <option value="NONE">No drives</option>
                  <option value="ONE_TWO">1–2 drives</option>
                  <option value="THREE_FIVE">3–5 drives</option>
                  <option value="SIX_PLUS">6 or more drives</option>
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Students placed
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={placedFilter}
                  onChange={e=>setPlacedFilter(e.target.value)}>
                  <option value="ALL">Any number</option>
                  <option value="NONE">No confirmed placements</option>
                  <option value="ONE_TWO">1–2 students</option>
                  <option value="THREE_PLUS">3 or more students</option>
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Designation
                <Input className={inputStyle+" mt-1.5 min-w-0"} value={designationFilter}
                  placeholder="Search designation" maxLength={100}
                  onChange={e=>updateFilter("designation",e.target.value)}/>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Can be reached by
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={reachFilter}
                  onChange={e=>updateFilter("reach",e.target.value)}>
                  <option value="ALL">Any contact method</option>
                  <option value="EMAIL">Has an email</option>
                  <option value="PHONE">Has a phone</option>
                   <option value="BOTH">Has both</option>
                   <option value="EITHER">Email or phone</option>
                  <option value="NEITHER">Neither</option>
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Next follow-up
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={nextFilter}
                  onChange={e=>updateFilter("nextFollowup",e.target.value)}>
                  <option value="ALL">Any date</option>
                  <option value="DUE">Due now</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="TODAY">Today</option>
                  <option value="NEXT_7">In the next 7 days</option>
                  <option value="LATER">Later</option>
                  <option value="NONE">None set</option>
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Last activity
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={activityFilter}
                  onChange={e=>updateFilter("lastActivity",e.target.value)}>
                  <option value="ALL">Any activity</option>
                  <option value="LAST_7">Last 7 days</option>
                  <option value="LAST_30">Last 30 days</option>
                  <option value="OVER_30">Over 30 days ago</option>
                  <option value="NEVER">Never</option>
                </Select>
              </label>
              <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Added
                <Select className={inputStyle+" mt-1.5 min-w-0"} value={addedFilter}
                  onChange={e=>updateFilter("added",e.target.value)}>
                  <option value="ALL">Any date</option>
                  <option value="LAST_7">Last 7 days</option>
                  <option value="LAST_30">Last 30 days</option>
                  <option value="EARLIER">Earlier</option>
                </Select>
              </label>
              <Button variant="secondary" type="button" className={buttonStyle} onClick={()=>{
                for(const key of ["owner","invite","status","source","query","company","designation",
                  "reach","nextFollowup","lastActivity","added","drives"] as const)updateFilter(key,"ALL");
                updateFilter("stage","ALL");updateFilter("attention","ALL");updateFilter("need","ALL");setPlacedFilter("ALL");
              }}>Clear filters</Button>
            </div>:null}
          </div>
          <p className="text-sm text-muted-foreground leading-[22px]" aria-live="polite">
            {visible.length} of {rows.length} in this view
          </p>
          {freshInvite ? (
            <section className="min-w-0 border-l-2 border-warning bg-warning-subtle px-3 py-3" aria-label="Fresh recruiter invite link">
              <p className="text-sm text-body leading-[22px]">Copy this link now. It is shown only once. No email has been sent.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Input readOnly aria-label="Invite link" value={freshInvite.url}
                  onFocus={event=>event.currentTarget.select()}
                  className={inputStyle+" min-w-0 flex-1"}/>
                <Button variant="secondary" type="button" className={buttonStyle} onClick={()=>void copyInvite()}>Copy</Button>
                <Button variant="secondary" type="button" className={buttonStyle} onClick={()=>setFreshInvite(null)}>Hide link</Button>
              </div>
            </section>
          ):null}
          {view !== "companies" ? (
            <div className="space-y-3">
              {view==="board"?<div className="flex flex-wrap gap-2">
                <Button variant="secondary" type="button" className={buttonStyle} disabled={!visible.length} onClick={()=>exportRows("shown","csv")}>Export CSV</Button>
                <Button variant="secondary" type="button" className={buttonStyle} disabled={!visible.some(row=>selectedIds.includes(row.id))}
                  onClick={()=>exportRows("selected","csv")}>Export selected ({visible.filter(row=>selectedIds.includes(row.id)).length})</Button>
                <Button variant="secondary" type="button" className={buttonStyle} disabled={!visible.length} onClick={()=>exportRows("shown","xlsx")}>Export Excel</Button>
                <Button variant="secondary" type="button" className={buttonStyle} disabled={!visible.some(row=>selectedIds.includes(row.id))}
                  onClick={()=>exportRows("selected","xlsx")}>Export selected Excel</Button>
                <Button variant="secondary" type="button" className={buttonStyle} disabled={!visible.length} onClick={()=>void copyRows()}>Copy rows</Button>
                {selectedIds.length>0?<Button variant="secondary" type="button" className={buttonStyle}
                  onClick={()=>setSelectedIds([])}>Clear selection</Button>:null}
                {exportFeedback?<p role="status" className="text-sm text-body leading-[22px]">{exportFeedback}</p>:null}
              </div>:null}
              {view==="board"?<RecruiterSavedViewControls columns={visibleColumns}/>:null}
              {visible.some(row=>selectedIds.includes(row.id))?<Button variant="secondary" type="button" className={buttonStyle}
                disabled={visible.filter(row=>selectedIds.includes(row.id)).length>100}
                onClick={()=>window.location.assign("/tpo/recruiters/campaigns/new?selected="+encodeURIComponent(visible.filter(row=>selectedIds.includes(row.id)).map(row=>row.id).join(",")))}>
                Send an email to selected ({visible.filter(row=>selectedIds.includes(row.id)).length})
              </Button>:null}
              {visible.filter(row=>selectedIds.includes(row.id)).length>100?<p role="alert" className="text-sm text-warning leading-[22px]">Select at most 100 recruiters for an email campaign. No one has been contacted.</p>:null}
              <RecruiterBulkInviteControls collegeId={collegeId}
                rows={visible.filter(row=>selectedIds.includes(row.id))} onUpdated={()=>void load()}/>
              <RecruiterBulkStageControls rows={visible} onUpdated={() => void load()} />
              <RecruiterBulkOwnerControls rows={visible} onUpdated={() => void load()} />
            </div>
          ) : null}
          {view !== "companies" && visible.length === 0 ? (
            <div className="border-y border-border py-8 text-center text-muted-foreground">
              {rows.length ? "No leads match your filters." : "No recruiters yet. Add a company contact to start tracking outreach."}
            </div>
          ) : view === "companies" ? (
            <section className="space-y-3" aria-label="Company filters">
              <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-border py-4 md:grid-cols-3">
                <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search company or people
                  <Input type="search" className={inputStyle+" mt-1.5 min-w-0"} value={companySearch}
                    onChange={e=>setCompanySearch(e.target.value)} placeholder="Search companies"/>
                </label>
                <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Contact
                  <Select className={inputStyle+" mt-1.5 min-w-0"} value={companyContacts}
                    onChange={e=>setCompanyContacts(e.target.value)}>
                    <option value="ALL">All companies</option>
                    <option value="HAS">With contacts</option>
                    <option value="NONE">Without contacts</option>
                  </Select>
                </label>
                <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Drives that ran
                  <Select className={inputStyle+" mt-1.5 min-w-0"} value={companyHistory}
                    onChange={e=>setCompanyHistory(e.target.value)}>
                    <option value="ALL">Any drive history</option>
                    <option value="HAS">Has drives</option>
                    <option value="NONE">No drives yet</option>
                  </Select>
                </label>
                <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Communication
                  <Select className={inputStyle+" mt-1.5 min-w-0"} value={companyCommunicationFilter}
                    onChange={e=>setCompanyCommunicationFilter(e.target.value)}>
                    <option value="ALL">All communication</option>
                    <option value="NOT_CONTACTED">Not contacted</option>
                    <option value="EMAILED">Emailed</option>
                    <option value="REPLIED">Replied</option>
                    <option value="MEETING_SET">Meeting set</option>
                    <option value="NOT_INTERESTED">Not interested</option>
                  </Select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={companyAliases}
                    onChange={e=>setCompanyAliases(e.target.checked)}/>
                  Typed more than one way
                </label>
                <Button variant="secondary" type="button" className={buttonStyle} onClick={()=>{
                  setCompanySearch("");setCompanyContacts("ALL");setCompanyHistory("ALL");setCompanyAliases(false);setCompanyCommunicationFilter("ALL");
                }}>Clear company filters</Button>
              </div>
              <p role="status" className="text-xs text-body leading-[20px]">{visibleCompanies.length} of {companies.length} companies</p>
              {!communicationReady?<p role="status" className="text-xs text-muted-foreground leading-[20px]">Communication changes are unavailable until company status storage is registered.</p>:null}
              {communicationError?<p role="alert" className="text-sm text-warning leading-[22px]">{communicationError}</p>:null}
              {companiesPhase !== "ready" ? (
                <p role="alert" className="text-sm text-body leading-[22px]">
                  {companiesPhase==="loading"?"Loading companies…":companiesError}
                </p>
              ) : visibleCompanies.length===0 ? (
                <p className="border-y border-border py-6 text-sm leading-[22px]">
                  No companies match the current filters.
                </p>
              ) : (
                <GridWorkspace rows={visibleCompanies} columns={engageCompanyColumns}
                  rowKey={company=>company.key} searchMode="hidden"
                  columnScope="local" columnStorageKey="tpo-engage-company-contacts-v1"
                  exportName="companies" onExportCsv={()=>exportCompanies()}>
                  {columnKeys=><EngageCompanyTpoGrid rows={visibleCompanies}
                    columns={engageCompanyColumns.filter(column=>columnKeys.includes(column.key))}
                    rowKey={company=>company.key} storageKey="tpo-engage-company-contacts-v1"
                    integratedWorkspace mobileActionsCollapsible
                    mobilePrimaryKeys={["Company","People","Communication"]}
                    openPrimary={{columnKey:"Company",ariaLabel:company=>"Open "+company.name+" company details",
                      onOpen:company=>router.push("/tpo/companies?name="+encodeURIComponent(company.name))}}
                    rowActions={company=><div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                      <Select aria-label={"Communication for "+company.name}
                        value={communication[company.key]??deriveLegacyCompanyCommunication(company.drivesRan,
                          rows.filter(row=>company.people.some(person=>person.id===row.id)))}
                        disabled={!communicationReady}
                        onChange={event=>void changeCompanyCommunication(company.key,event.target.value)}>
                        <option value="NOT_CONTACTED">Not contacted</option>
                        <option value="EMAILED">Emailed</option>
                        <option value="REPLIED">Replied</option>
                        <option value="MEETING_SET">Meeting set</option>
                        <option value="NOT_INTERESTED">Not interested</option>
                      </Select>
                      {company.people.length?company.people.map(person=>
                        <Link key={person.id}
                          className="lms-inline-link inline-flex min-h-11 items-center break-words text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                          href={"/tpo/recruiters/"+encodeURIComponent(person.id)}>{person.name}</Link>
                      ):<Button variant="secondary" type="button" className="min-h-11"
                        onClick={()=>{setForm({...EMPTY,companyName:company.name});setAdding(true);}}>Add a contact</Button>}
                    </div>}
                  />}
                </GridWorkspace>

              )}
            </section>
          ) : view === "table" ? (
            <GridWorkspace rows={sortedVisible} columns={RECRUITER_GRID_COLUMNS}
              rowKey={lead=>lead.id} selection={{selected:selectedIds,onChange:setSelectedIds}}
              columnKeys={visibleColumns}
              onColumnKeysChange={keys=>changeVisibleColumns(normalizeEngageColumns(
               keys.filter(key=>ENGAGE_COLUMNS.includes(key as EngageColumn))))}
              searchMode="hidden" exportName="recruiter-leads"
              externalFilters={{count:filterChips.length,open:filterOpen,controlsId:"engage-filter-panel",
               onToggle:()=>setFilterOpen(previous=>!previous)}}
              savedViews={<RecruiterSavedViewControls columns={visibleColumns}/>}
              onExportCsv={selected=>exportRows(selected?"selected":"shown","csv")}
              onExportXlsx={selected=>exportRows(selected?"selected":"shown","xlsx")}
              onCopyRows={()=>void copyRows()}>
              {visibleKeys=><>
               {exportFeedback?<p role="status" className="text-sm text-body leading-[22px]">{exportFeedback}</p>:null}
              <RecruiterRosterDisplayControls columns={visibleColumns} onColumns={changeVisibleColumns}
                sort={rosterSort} onSort={changeRosterSort} ascending={sortAscending} onAscending={changeSortAscending}
                 showColumns={false}/>
              <RecruiterTpoGrid rows={sortedVisible}
                columns={RECRUITER_GRID_COLUMNS.filter(column=>visibleKeys.includes(column.key)&&column.key!=="Actions")}
                rowKey={lead=>lead.id} storageKey="tpo-engage-recruiter-roster-v1"
                integratedWorkspace mobileActionsCollapsible
                mobilePrimaryKeys={["Contact","Company","Status","Stage"]}
                selection={{selected:selectedIds,onChange:setSelectedIds,allIds:sortedVisible.map(lead=>lead.id)}}
                openPrimary={{
                  columnKey:"Contact",
                  ariaLabel:lead=>"Open "+(lead.name||"recruiter")+" details",
                  onOpen:lead=>router.push("/tpo/recruiters/"+encodeURIComponent(lead.id)),
                }}
                rowActions={visibleColumns.some(column=>["Stage","Owner","Actions"].includes(column))
                  ?lead=><div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                    {visibleColumns.includes("Stage")?<RecruiterInlineStage lead={lead} onUpdated={()=>void load()}/>:null}
                    {visibleColumns.includes("Owner")?<RecruiterInlineOwner lead={lead} onUpdated={()=>void load()}/>:null}
                    {visibleColumns.includes("Actions")
                      ?(!lead.recruiterUserId?<Button variant="secondary" type="button" className="min-h-11"
                        disabled={Boolean(invitingId)||!lead.emailNorm||!lead.companyRelationshipId||Boolean(lead.unsubscribedAt)}
                        title={!lead.emailNorm||!lead.companyRelationshipId?"Add a work email and link a company before inviting.":undefined}
                        onClick={()=>void createInviteLink(lead)}>{lead.inviteSentAt?"Resend invite":"Invite"}</Button>
                      :<span className="text-xs text-muted-foreground">Joined</span>):null}
                  </div>:undefined}
              />
              </>}

            </GridWorkspace>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3" role="region" aria-label="Recruiter stage board">
              {(["NEW", "CONTACTED", "INVITED", "JOINED", "DRIVE_PLANNED", "RECRUITED", "NOT_NOW"] as const).map(column => (
                <section key={column} className={
                  boardStyles.column+" "+
                  (draggedBoardId&&column==="CONTACTED"?"ring-2 ring-primary":"")
                 }
                  onDragOver={event=>{
                    if(column==="CONTACTED"&&draggedBoardId&&!boardMoving)event.preventDefault();
                  }}
                  onDrop={event=>{
                    if(column!=="CONTACTED"||!draggedBoardId)return;
                    event.preventDefault();
                    void moveBoardLeadToContacted(draggedBoardId);
                  }}>
                  <p className="mb-2 text-xs text-muted-foreground leading-[20px]">
                    {column==="NEW"?"New contacts are moved when outreach is recorded":
                     column==="CONTACTED"?"Manually move or log a follow-up":
                     column==="NOT_NOW"?"Requires a recorded reason":
                     "Automatically set by invitation and placement activity"}
                  </p>
                  <h2 className={"mb-3 font-semibold "+boardStyles.columnTitle}>{RECRUITER_STAGE_LEGACY_LABELS[column]} · {visible.filter(x => x.stage === column).length}</h2>
                  <div className="space-y-2">
                    {visible.filter(x => x.stage === column).slice(0, column==="RECRUITED"||column==="NOT_NOW"?5:50).map(lead => (
                      <div key={lead.id} className={"p-3 hover:bg-surface-secondary "+boardStyles.leadCard}
                        draggable={lead.manualStage==="NEW"&&!boardMoving}
                        onDragStart={event=>{if(lead.manualStage==="NEW"){event.dataTransfer.setData("text/plain",lead.id);event.dataTransfer.effectAllowed="move";setDraggedBoardId(lead.id);}}}
                        onDragEnd={()=>setDraggedBoardId(null)}
                        title={lead.manualStage==="NEW"?"Drag to Contacted, or use Move to… below":undefined}>
                        <Link href={"/tpo/recruiters/" + encodeURIComponent(lead.id)}
                          className="block text-link lms-inline-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                        <span className="block font-medium">{lead.name||"Unnamed contact"}</span>
                         {lead.designation?<span className="block text-xs text-muted-foreground">{lead.designation}</span>:null}
                        <span className="block text-sm text-muted-foreground">{lead.companyName || lead.emailNorm || lead.phoneNorm}</span>
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                           {lead.nextFollowupAt?<span className="text-xs text-muted-foreground">
                             Follow-up {new Date(lead.nextFollowupAt).toLocaleDateString("en-IN")}
                           </span>:null}
                           {lead.ownerName?<span className="text-xs text-muted-foreground">Owner: {lead.ownerName}</span>:null}
                         </div>
                         <Dropdown mobileSheet align="end" label={"Actions for "+lead.name} trigger="Move to… / Actions" className="mt-2 max-w-full text-xs">
                           <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                             Invited, Joined, Drive planned and Recruited update automatically.
                             Not now requires a reason.
                           </p>
                           <div role="group" aria-label={"Update "+(lead.name||"recruiter")} className="mt-2 min-w-0 space-y-2 break-words [overflow-wrap:anywhere]">
                             <RecruiterInlineStage lead={lead} onUpdated={()=>void load()} />
                             <RecruiterInlineOwner lead={lead} onUpdated={()=>void load()} />
                             <Link className="inline-flex min-h-11 max-w-full items-center rounded-[var(--lms-control-radius)] px-3 text-[var(--lms-teal-deep)] underline hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                               href={"/tpo/recruiters/"+encodeURIComponent(lead.id)}>Open recruiter</Link>
                             <Button variant="ghost" type="button" className="min-h-11 w-full justify-center md:min-h-9"
                               onClick={event=>{
                                 const root=event.currentTarget.closest("details");
                                 if(root){root.open=false;root.querySelector("summary")?.focus();}
                               }}>Close actions</Button>
                           </div>
                         </Dropdown>
                         {!lead.recruiterUserId&&!lead.unsubscribedAt?
                         <Button variant="secondary" type="button" className={buttonStyle+" mt-2"}
                          disabled={Boolean(invitingId)||!lead.emailNorm||!lead.companyRelationshipId} onClick={()=>void createInviteLink(lead)}>Create invite link</Button>:null}
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
        <Dialog open={adding && confirmation?.kind!=="DISCARD"} onOpenChange={next=>{if(!next)closeAddDialog();}}
          dismissible={!saving} title="Add recruiter lead">
          <form ref={createDialogRef} onSubmit={e=>void create(e)}
            className="min-w-0 space-y-4">
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name *<Input ref={createNameRef} className={inputStyle + " mt-1.5 min-w-0"} required maxLength={150}
              placeholder="Ravi Kumar" autoComplete="name"
              value={form.name} onChange={e => field("name", e.target.value)} /></label>
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Designation<Input className={inputStyle + " mt-1.5 min-w-0"} maxLength={100}
              placeholder="HR Manager" autoComplete="organization-title"
              value={form.designation} onChange={e => field("designation", e.target.value)} /></label>
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Email<Input className={inputStyle + " mt-1.5 min-w-0"} type="email" maxLength={150}
              placeholder="ravi@acme.com" autoComplete="email"
              value={form.email} onChange={e => field("email", e.target.value)} /></label>
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Phone<Input className={inputStyle + " mt-1.5 min-w-0"} type="tel" maxLength={30}
              placeholder="98xxxxxx01" inputMode="tel" autoComplete="tel"
              value={form.phone} onChange={e => field("phone", e.target.value)} /></label>
            <Button variant="secondary" type="button" className={buttonStyle} disabled={checking || !(form.email || form.phone)}
              onClick={() => void checkContact()}>{checking ? "Checking…" : "Check for existing contact"}</Button>
            {duplicate ? <p role="alert" className="text-sm text-foreground leading-[22px]">
              Contact already exists: <Link className="underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center md:min-h-[var(--lms-control-height)]" href={"/tpo/recruiters/" + duplicate.id}>{duplicate.name}</Link>.
            </p> : null}
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company *<Input className={inputStyle + " mt-1.5 min-w-0"} required maxLength={150}
              value={form.companyName} onChange={e => field("companyName", e.target.value)}
              list="known-engage-companies" placeholder="Company name" />
              <datalist id="known-engage-companies">
                {companies.map(company=><option key={company.key} value={company.name}/>)}
              </datalist>
              <span className="mt-1 block text-xs text-muted-foreground">
                Choose a company you&apos;ve worked with, or type a new company name.
              </span>
            </label>
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Where did you find them?
              <Select className={inputStyle + " mt-1.5 min-w-0"} value={form.source}
                onChange={e => field("source", e.target.value)}>
                <option value="">Alumni, referral, LinkedIn… (optional)</option>
                {sourceOptions.map(([code,label]) => <option value={code} key={code}>{label}</option>)}
              </Select>
            </label>
            <details className="border-t border-border pt-3" open={Boolean(form.followupDate)}>
              <summary className="min-h-11 cursor-pointer py-3 text-[13px] font-semibold md:min-h-9">First follow-up (optional, IST)</summary>
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First follow-up (optional, IST)
              <Input type="datetime-local" step={60} className={inputStyle+" mt-1.5 min-w-0"} value={form.followupDate}
                onChange={e=>field("followupDate",e.target.value)}/>
            </label>
            <label className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Follow-up note (optional)
              <Textarea className={inputStyle+" mt-1.5 min-w-0"} maxLength={500} value={form.followupNote}
                onChange={e=>field("followupNote",e.target.value)}
                disabled={!form.followupDate}
                placeholder="What should the placement cell do next?"/>
            </label>
            </details>
            {reviewingCreate?<div role="status" className="border-l-[3px] border-primary bg-primary-subtle p-3 text-sm">
              <p>Confirm: Create recruiter lead for <strong>{form.name.trim()}</strong> at <strong>{form.companyName.trim()}</strong>?
                This saves a new college contact and records an auditable creation event.
              </p>
              {form.followupDate?<p>First follow-up: {form.followupDate.replace("T"," ")} (IST)</p>:null}
              <Button variant="secondary" type="button" className="mt-2 text-link underline lms-inline-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" onClick={()=>setReviewingCreate(false)}>
                Edit details
              </Button>
            </div>:null}
            {saveError && <p role="alert" className="break-words text-sm text-error leading-[22px]">{saveError}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 md:flex-row md:justify-end">
              <Button variant="secondary" type="button" className="w-full md:w-auto" onClick={()=>closeAddDialog()} disabled={saving}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving} className={primaryStyle+" w-full sm:w-auto"}
                disabled={saving || checking || Boolean(duplicate)}>
                {saving ? "Creating…" : reviewingCreate?"Confirm and create recruiter":"Review and create recruiter"}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      <ConfirmDialog open={confirmation!==null}
        onOpenChange={next=>{if(!next)setConfirmation(null);}}
        title={confirmation?.kind==="CONTACTED"
          ?"Mark "+(rows.find(row=>row.id===confirmation.leadId)?.name??"recruiter")+" as Contacted?"
          :confirmation?.kind==="INVITE"?"Make a new link?":"Discard this recruiter draft?"}
        description={confirmation?.kind==="CONTACTED"?"This adds an audited stage-change entry."
          :confirmation?.kind==="INVITE"?"The old link stops working.":"Your unsubmitted recruiter changes will be lost."}
        confirmLabel="Confirm"
        onConfirm={()=>{
          const target=confirmation;
          setConfirmation(null);
          if(target?.kind==="DISCARD")closeAddDialog(true);
          else if(target?.kind==="CONTACTED"&&target.leadId)void moveBoardLeadToContacted(target.leadId,true);
          else if(target?.kind==="INVITE"&&target.leadId){
            const lead=rows.find(row=>row.id===target.leadId);
            if(lead)void createInviteLink(lead,true);
          }
        }}/>
    </section>
  );
}
