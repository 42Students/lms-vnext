"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Banner} from "@/components/ui/banner";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useFormDraft } from "@/hooks/use-form-draft";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";
import {
  ACCOUNT_OPTIONS, ENVIRONMENT_OPTIONS, ISSUE_TYPE_OPTIONS,
  LOCATION_OPTIONS, REPORTER_OPTIONS, SEVERITY_OPTIONS,
} from "@/modules/bug-tracker/report-form-options";
import { trackerReportSchema } from "@/modules/bug-tracker/report-input-model";

const field = "mt-1 w-full";
const label = "block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]";

export function TrackerReportForm({contextPrefill="",canSearchSimilar=true,knownErrorId}:{contextPrefill?:string;canSearchSimilar?:boolean;knownErrorId?:string}={}) {
  const initial={reporterName:"",accountRole:"",environment:"",page:"",screen:"",section:"",issueType:"",severity:"NOT_SURE",description:contextPrefill?"\n\nCaptured context:\n"+contextPrefill:"",evidenceLink:""};
  const {draft,setDraft,restored,dirty,clearDraft}=useFormDraft("tracker-issue-report",initial);
  const {page,screen}=draft;
  const patch=(key:keyof typeof initial,value:string)=>setDraft(current=>({...current,[key]:value}));
  const [pending, setPending] = useState(false);
  const submitLock=useRef(false);
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  const [linkIssueError,setLinkIssueError]=useState("");
  const [similarQuery,setSimilarQuery]=useState("");
  const [similarResults,setSimilarResults]=useState<{publicId:string;description:string;status:string}[]>([]);
  const [similarLoading,setSimilarLoading]=useState(false);
  const [similarError,setSimilarError]=useState("");
  const [similarSearched,setSimilarSearched]=useState(false);
  const selectedPage = LOCATION_OPTIONS.find(item => item.value === page);
  const selectedScreen = selectedPage?.children?.find(item => item.value === screen);

  /** A linked issue is never lost if the second authorized write fails. */
  async function linkCreatedIssue(publicId:string){
    if(!knownErrorId)return true;
    try{
      await apiFetch("/api/tracker/logs/known-errors/"+encodeURIComponent(knownErrorId),{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"LINK_ISSUE",issuePublicId:publicId}),
      });
      setLinkIssueError("");
      return true;
    }catch{
      setLinkIssueError("Issue created, but its Known Error link was not saved. Use Retry linking to reconnect it.");
      return false;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending||submitLock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    if(contextPrefill&&
      value("description").replace("\n\nCaptured context:\n"+contextPrefill,"").trim().length===0){
      setError("Describe what went wrong before submitting the captured context.");
      return;
    }
    const parsed = trackerReportSchema.safeParse({
      reporterName: value("reporterName"), accountRole: value("accountRole"),
      environment: value("environment"), page, screen: screen || null,
      section: value("section") || null, issueType: value("issueType"),
      severity: value("severity"), description: value("description"),
      evidenceLink: value("evidenceLink") || null,
    });
    if (!parsed.success) {
      const errors:Record<string,string>={};
      for(const issue of parsed.error.issues){
        const key=String(issue.path[0]??"");
        if(key&&!errors[key])errors[key]=issue.message;
      }
      setFieldErrors(errors);
      setError("Check the highlighted report fields.");
      return;
    }
    setFieldErrors({});
    submitLock.current=true;
    setPending(true); setError("");
    try {
      const payload=await apiFetch<{issue:{publicId:string}}>("/api/tracker/issues", {
        method: "POST",headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      clearDraft();
      setCreated(payload.issue.publicId);
      await linkCreatedIssue(payload.issue.publicId);
    } catch (caught) {
      setError(caught instanceof FriendlyFetchError ? caught.message :
        "The issue could not be reported. Your text is still here — please try again.");
    } finally {
      submitLock.current=false;
      setPending(false);
    }
  }

  async function checkSimilar(){
    if(!canSearchSimilar)return;
    if(similarLoading || similarQuery.trim().length<3)return;
    setSimilarLoading(true);setSimilarError("");setSimilarResults([]);setSimilarSearched(false);
    try{
      const query=new URLSearchParams({q:similarQuery.trim(),limit:"5",sort:"newest"});
      const result=await apiFetch<{items:{publicId:string;description:string;status:string}[]}>(
        "/api/tracker/issues?"+query.toString(),{cache:"no-store"});
      setSimilarResults(result.items??[]);setSimilarSearched(true);
    }catch(cause){
      setSimilarError("Related issues are temporarily unavailable.");
    }finally{setSimilarLoading(false);}
  }

  function onFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  }

  if (created) return (
    <section className="space-y-4 border-b border-border py-5" aria-live="polite">
      <StatusBadge tone="success">Issue reported</StatusBadge>
      <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{created}</h2>
      <p className="text-sm text-body leading-[22px]">The issue is saved. You can continue testing immediately.</p>
      {linkIssueError?<InlineNotice tone="error" message={linkIssueError}/>:null}
      {knownErrorId&&linkIssueError?<Button type="button"
        variant="secondary"
        onClick={()=>void linkCreatedIssue(created)}>Retry linking Known Error</Button>:null}

      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-white px-4 text-[14px] font-[650] text-[var(--lms-body-text)] transition-colors duration-[150ms] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none" href={(canSearchSimilar?"/tracker/issues/":"/tracker/mine/") + encodeURIComponent(created)}>View issue</Link>
        <Button 
          onClick={() => {setCreated("");setDraft(initial);clearDraft();setError("");}}
          type="button" className="min-h-11 md:min-h-9">Report another</Button>
      </div>
    </section>
  );

  return (
    <form onSubmit={submit} onKeyDown={onFormKeyDown}
      className="space-y-5">
      {restored?<Banner tone="info" action={<Button type="button" variant="secondary" onClick={()=>{setDraft(initial);clearDraft();}}>Discard draft</Button>}>
        Unsaved report restored.
      </Banner>:null}
      {dirty?<p className="text-xs text-muted-foreground leading-[20px]">Unsaved changes are kept on this device until your report is submitted.</p>:null}
      <div className="grid gap-4 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
        <label className={label}>Reporter
          <Select className={field} name="reporterName" required value={draft.reporterName} onChange={event=>patch("reporterName",event.target.value)}>
            <option value="" disabled>Select reporter</option>
            {REPORTER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors.reporterName?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.reporterName}</span>:null}
        </label>
        <label className={label}>Account used
          <Select className={field} name="accountRole" required value={draft.accountRole} onChange={event=>patch("accountRole",event.target.value)}>
            <option value="" disabled>Select account</option>
            {ACCOUNT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors.accountRole?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.accountRole}</span>:null}
        </label>
        <label className={label}>Environment
          <Select className={field} name="environment" required value={draft.environment} onChange={event=>patch("environment",event.target.value)}>
            <option value="" disabled>Select environment</option>
            {ENVIRONMENT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors.environment?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.environment}</span>:null}
        </label>
      </div>
      <fieldset className="grid min-w-0 gap-3 border-y border-border py-4">
        <legend className="px-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Where did this happen?</legend>
        <div className="grid gap-3 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
          <label className={label}>Page
            <Select className={field} required value={page} onChange={event => {
              setDraft(current=>({...current,page:event.target.value,screen:"",section:""}));
            }}>
              <option value="" disabled>Search or select page → screen → section</option>
              {LOCATION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {fieldErrors.page?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.page}</span>:null}
          </label>
          <label className={label}>Screen
            <Select className={field} required={Boolean(selectedPage?.children?.length)}
              disabled={!selectedPage?.children?.length}
              value={screen} onChange={event => setDraft(current=>({...current,screen:event.target.value,section:""}))}>
              <option value="">Select screen</option>
              {selectedPage?.children?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {fieldErrors.screen?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.screen}</span>:null}
          </label>
          <label className={label}>Section
            <Select className={field} name="section" key={page + ":" + screen}
              required={Boolean(selectedScreen?.children?.length)} disabled={!selectedScreen?.children?.length} value={draft.section}
              onChange={event=>patch("section",event.target.value)}>
              <option value="">Select section</option>
              {selectedScreen?.children?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {fieldErrors.section?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.section}</span>:null}
          </label>
        </div>
      </fieldset>
      <div className="grid gap-4 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
        <label className={label + " min-[992px]:col-span-2"}>What kind of issue?
          <Select className={field} name="issueType" required value={draft.issueType} onChange={event=>patch("issueType",event.target.value)}>
            <option value="" disabled>Search issue type</option>
            {ISSUE_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        <label className={label}>Severity
          <Select className={field} name="severity" value={draft.severity} onChange={event=>patch("severity",event.target.value)} required>
            {SEVERITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors.severity?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.severity}</span>:null}
        </label>
      </div>
      <label className={label}>What went wrong?
        <Textarea className={field + " min-h-36"} name="description" required maxLength={4000} rows={6}
          value={draft.description} onChange={event=>patch("description",event.target.value)}
          placeholder="Example: I opened Lesson 3 and the lesson content kept loading without showing anything." />
        <span className="mt-1 block text-xs font-normal text-muted-foreground">Up to 4000 characters</span>
        {fieldErrors.description?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.description}</span>:null}
      </label>
      <details className="min-w-0 border-b border-border pb-4" open={Boolean(draft.evidenceLink)}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Optional evidence link</summary>
        <label className={label + " mt-2"}>Evidence link
          <Input className={field} name="evidenceLink" type="url" maxLength={1000} placeholder="https://…" value={draft.evidenceLink} onChange={event=>patch("evidenceLink",event.target.value)}/>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Optional — add a shareable HTTP/HTTPS evidence link (HTTPS recommended). Do not share private screenshots through public URLs. Direct clipboard paste and unscanned attachments are not accepted.
          </span>
        </label>
      </details>
      {canSearchSimilar ? <>
      <details aria-label="Similar issues" className="min-w-0 border-y border-border py-4" open={Boolean(similarQuery.trim())}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Similar issues</summary>
        <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Search previously reported issues by a short phrase. Only reports you are allowed to read appear here.</p>
        <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
          <Input aria-label="Find similar issues by keyword" type="search" value={similarQuery}
            onChange={event=>{setSimilarQuery(event.target.value);setSimilarSearched(false);setSimilarError("");}}
            maxLength={100} placeholder="e.g. Quiz submission"
            className={field+" min-h-11 min-w-0 w-full basis-full md:w-55 md:basis-auto md:flex-none"}/>
          <Button type="button" onClick={()=>void checkSimilar()}
            disabled={similarLoading||similarQuery.trim().length<3} loading={similarLoading}
            variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">
            {similarLoading?"Searching…":"Find similar issues"}
          </Button>
        </div>
        {similarError?<InlineNotice tone="error" message={similarError}/>:null}
        {similarSearched?<div role="status" className="mt-2 text-sm">
          {similarResults.length?<ul className="divide-y divide-border">
            {similarResults.map(issue=><li key={issue.publicId} className="py-3">
              <Link href={"/tracker/issues/"+encodeURIComponent(issue.publicId)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{issue.publicId}</Link>
              <span className="ml-2 inline-flex align-middle"><StatusBadge tone="neutral">{issue.status}</StatusBadge></span>
              <p className="mt-1 break-words text-xs text-body leading-[20px]">{issue.description.slice(0,160)}</p>
            </li>)}
          </ul>:<p>No existing reports match this phrase. You can submit a new issue.</p>}
        </div>:null}
      </details>
      </> : null}
      {error ? <InlineNotice tone="error" message={error}/> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground leading-[20px]">Draft saves automatically on this device. Ctrl/⌘ + Enter to submit. Private screenshot uploads are not yet enabled.</p>
        <Button disabled={pending} loading={pending} type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">
          {pending ? "Reporting…" : "Report issue"}
        </Button>
      </div>
    </form>
  );
}
