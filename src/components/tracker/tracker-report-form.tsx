"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useFormDraft } from "@/hooks/use-form-draft";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";
import {
  ACCOUNT_OPTIONS, ENVIRONMENT_OPTIONS, ISSUE_TYPE_OPTIONS,
  LOCATION_OPTIONS, REPORTER_OPTIONS, SEVERITY_OPTIONS,
} from "@/modules/bug-tracker/report-form-options";
import { trackerReportSchema } from "@/modules/bug-tracker/report-input-model";

const field = "mt-1 min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]";
const label = "block text-sm font-semibold text-body";

export function TrackerReportForm({contextPrefill="",canSearchSimilar=true,knownErrorId}:{contextPrefill?:string;canSearchSimilar?:boolean;knownErrorId?:string}={}) {
  const initial={reporterName:"",accountRole:"",environment:"",page:"",screen:"",section:"",issueType:"",severity:"NOT_SURE",description:contextPrefill?"\n\nCaptured context:\n"+contextPrefill:"",evidenceLink:""};
  const {draft,setDraft,restored,dirty,clearDraft}=useFormDraft("tracker-issue-report",initial);
  const {page,screen}=draft;
  const patch=(key:keyof typeof initial,value:string)=>setDraft(current=>({...current,[key]:value}));
  const [pending, setPending] = useState(false);
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
    if (pending) return;
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
      setError(parsed.error.issues[0]?.message ?? "Check your report details.");
      return;
    }
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
      setError(caught instanceof FriendlyFetchError ? caught.message : friendlyApiError({}));
    } finally {
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
    <section className="space-y-4 rounded-xl border border-border bg-surface p-6" aria-live="polite">
      <p className="text-sm font-semibold text-success">Issue reported</p>
      <h2 className="text-xl font-semibold">{created}</h2>
      <p className="text-sm text-body">The issue is saved. You can continue testing immediately.</p>
      {linkIssueError?<p role="alert" className="text-sm text-body">{linkIssueError}</p>:null}
      {knownErrorId&&linkIssueError?<Button type="button"
        className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold"
        onClick={()=>void linkCreatedIssue(created)}>Retry linking Known Error</Button>:null}

      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={(canSearchSimilar?"/tracker/issues/":"/tracker/mine/") + encodeURIComponent(created)}>View issue</Link>
        <Button className="rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 py-2 text-sm font-[650] text-[var(--lms-on-primary)]"
          onClick={() => {setCreated("");setDraft(initial);clearDraft();setError("");}}
          type="button">Report another</Button>
      </div>
    </section>
  );

  return (
    <form onSubmit={submit} onKeyDown={onFormKeyDown}
      className="space-y-5">
      {restored?<div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
        <span>Unsaved report restored.</span><Button type="button" onClick={()=>{setDraft(initial);clearDraft();}} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold">Discard draft</Button>
      </div>:null}
      {dirty?<p className="text-xs text-muted-foreground">Unsaved changes are kept on this device until your report is submitted.</p>:null}
      <div className="grid gap-4 md:grid-cols-3">
        <label className={label}>Reporter
          <Select className={field} name="reporterName" required value={draft.reporterName} onChange={event=>patch("reporterName",event.target.value)}>
            <option value="" disabled>Select reporter</option>
            {REPORTER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        <label className={label}>Account used
          <Select className={field} name="accountRole" required value={draft.accountRole} onChange={event=>patch("accountRole",event.target.value)}>
            <option value="" disabled>Select account</option>
            {ACCOUNT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        <label className={label}>Environment
          <Select className={field} name="environment" required value={draft.environment} onChange={event=>patch("environment",event.target.value)}>
            <option value="" disabled>Select environment</option>
            {ENVIRONMENT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
      </div>
      <fieldset className="grid gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Where did this happen?</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <label className={label}>Page
            <Select className={field} required value={page} onChange={event => {
              setDraft(current=>({...current,page:event.target.value,screen:"",section:""}));
            }}>
              <option value="" disabled>Search or select page → screen → section</option>
              {LOCATION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </label>
          <label className={label}>Screen
            <Select className={field} required={Boolean(selectedPage?.children?.length)}
              disabled={!selectedPage?.children?.length}
              value={screen} onChange={event => setDraft(current=>({...current,screen:event.target.value,section:""}))}>
              <option value="">Select screen</option>
              {selectedPage?.children?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </label>
          <label className={label}>Section
            <Select className={field} name="section" key={page + ":" + screen}
              required={Boolean(selectedScreen?.children?.length)} disabled={!selectedScreen?.children?.length} value={draft.section}
              onChange={event=>patch("section",event.target.value)}>
              <option value="">Select section</option>
              {selectedScreen?.children?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </label>
        </div>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-3">
        <label className={label + " md:col-span-2"}>What kind of issue?
          <Select className={field} name="issueType" required value={draft.issueType} onChange={event=>patch("issueType",event.target.value)}>
            <option value="" disabled>Search issue type</option>
            {ISSUE_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        <label className={label}>Severity
          <Select className={field} name="severity" value={draft.severity} onChange={event=>patch("severity",event.target.value)} required>
            {SEVERITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
      </div>
      <label className={label}>What went wrong?
        <Textarea className={field + " min-h-36"} name="description" required maxLength={4000} rows={6}
          value={draft.description} onChange={event=>patch("description",event.target.value)}
          placeholder="Example: I opened Lesson 3 and the lesson content kept loading without showing anything." />
        <span className="mt-1 block text-xs font-normal text-muted-foreground">Up to 4000 characters</span>
      </label>
      <label className={label}>Evidence link
        <Input className={field} name="evidenceLink" type="url" maxLength={1000} placeholder="https://…" value={draft.evidenceLink} onChange={event=>patch("evidenceLink",event.target.value)}/>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          Optional — add a shareable HTTP/HTTPS evidence link (HTTPS recommended). Do not share private screenshots through public URLs. Direct clipboard paste and unscanned attachments are not accepted.
        </span>
      </label>
      {canSearchSimilar ? <>
      <section aria-label="Similar issues" className="rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Similar issues</h2>
        <p className="mt-1 text-xs text-muted-foreground">Search previously reported issues by a short phrase. Only reports you are allowed to read appear here.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input aria-label="Find similar issues by keyword" type="search" value={similarQuery}
            onChange={event=>{setSimilarQuery(event.target.value);setSimilarSearched(false);setSimilarError("");}}
            maxLength={100} placeholder="e.g. Quiz submission"
            className={field+" min-w-48 flex-1"}/>
          <Button type="button" onClick={()=>void checkSimilar()}
            disabled={similarLoading||similarQuery.trim().length<3}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
            {similarLoading?"Searching…":"Find similar issues"}
          </Button>
        </div>
        {similarError?<p role="alert" className="mt-2 text-sm text-error">{similarError}</p>:null}
        {similarSearched?<div role="status" className="mt-2 text-sm">
          {similarResults.length?<ul className="space-y-2">
            {similarResults.map(issue=><li key={issue.publicId} className="rounded-[var(--lms-control-radius)] border border-border p-2">
              <Link href={"/tracker/issues/"+encodeURIComponent(issue.publicId)} className="inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{issue.publicId}</Link>
              <span className="ml-2 text-xs text-muted-foreground">{issue.status}</span>
              <p className="mt-1 break-words text-xs text-body">{issue.description.slice(0,160)}</p>
            </li>)}
          </ul>:<p>No existing reports match this phrase. You can submit a new issue.</p>}
        </div>:null}
      </section>
      </> : null}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Ctrl/⌘ + Enter to submit</p>
        <Button disabled={pending} type="submit"
          className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-5 py-2 text-sm font-[650] text-[var(--lms-on-primary)] disabled:opacity-60">
          {pending ? "Reporting…" : "Report issue"}
        </Button>
      </div>
    </form>
  );
}
