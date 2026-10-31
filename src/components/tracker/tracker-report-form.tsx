"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Banner} from "@/components/ui/banner";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
type Screenshot = {id:string;file:File;preview:string;state:"PENDING"|"UPLOADING"|"UPLOADED"|"FAILED";
 storageKey?:string;uploadToken?:string;putComplete?:boolean;error?:string|undefined};
const SCREENSHOT_LIMIT=8*1024*1024;

import { useFormDraft } from "@/hooks/use-form-draft";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import {
  ACCOUNT_OPTIONS, ENVIRONMENT_OPTIONS, ISSUE_TYPE_OPTIONS,
  LOCATION_OPTIONS, SEVERITY_OPTIONS,
} from "@/modules/bug-tracker/report-form-options";
import { trackerReportSchema } from "@/modules/bug-tracker/report-input-model";

const field = "mt-1 w-full";
const label = "block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]";

export function TrackerReportForm({contextPrefill="",canSearchSimilar=true,knownErrorId}:{contextPrefill?:string;canSearchSimilar?:boolean;knownErrorId?:string}={}) {
  const initial={reporterName:"",accountRole:"",environment:"",page:"",screen:"",section:"",issueType:"",severity:"NOT_SURE",description:contextPrefill?"\n\nCaptured context:\n"+contextPrefill:"",evidenceLink:""};
  const {draft,setDraft,restored,dirty,clearDraft,flushDraft}=useFormDraft("tracker-issue-report",initial);
  const {page,screen}=draft;
  // Preserve the same key through ambiguous network retries, but regenerate
  // it as soon as the reporter changes any field and intends a new submission.
  const retryKeyRef=useRef<string|null>(null);
  const patch=(key:keyof typeof initial,value:string)=>{
    retryKeyRef.current=null;
    setDraft(current=>({...current,[key]:value}));
  };
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
  const similarRequest=useRef(0);
  const [recentContext,setRecentContext]=useState({reporterName:"",accountRole:"",environment:""});

  const [screenshotStatus,setScreenshotStatus]=useState("");
  const [screenshots,setScreenshots]=useState<Screenshot[]>([]);
  const screenshotsRef=useRef<Screenshot[]>([]);
  const screenshotInputRef=useRef<HTMLInputElement>(null);
  const uploadLock=useRef(false);
  const [uploading,setUploading]=useState(false);
  useEffect(()=>()=>{for(const row of screenshotsRef.current)URL.revokeObjectURL(row.preview);},[]);
  function updateScreenshot(id:string,change:Partial<Screenshot>){
    screenshotsRef.current=screenshotsRef.current.map(row=>row.id===id?{...row,...change}:row);
    setScreenshots(screenshotsRef.current);
  }
  function addScreenshots(files:readonly File[]){
    const next=[...screenshotsRef.current];
    let message="";
    for(const file of files){
      if(next.length>=3){message="A report accepts up to 3 screenshots.";break;}
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)){
        message="Screenshots must be PNG, JPEG or WebP.";continue;
      }
      if(!file.size||file.size>SCREENSHOT_LIMIT||file.name.length>255){
        message="Choose images of at most 8 MB with valid filenames.";continue;
      }
      next.push({id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),state:"PENDING"});
    }
    screenshotsRef.current=next;setScreenshots(next);
    setScreenshotStatus(message||"Screenshots are uploaded privately after the report is saved.");
  }
  function removeScreenshot(id:string){
    if(uploadLock.current)return;
    const row=screenshotsRef.current.find(item=>item.id===id);
    if(row)URL.revokeObjectURL(row.preview);
    screenshotsRef.current=screenshotsRef.current.filter(item=>item.id!==id);
    setScreenshots(screenshotsRef.current);
  }
  function clearScreenshots(){
    for(const row of screenshotsRef.current)URL.revokeObjectURL(row.preview);
    screenshotsRef.current=[];setScreenshots([]);setScreenshotStatus("");
  }
  async function uploadScreenshots(publicId:string){
    if(uploadLock.current)return;
    uploadLock.current=true;setUploading(true);
    const endpoint="/api/bug-tracker/reports/"+encodeURIComponent(publicId)+"/attachments";
    for(const row of screenshotsRef.current){
      if(row.state==="UPLOADED")continue;
      updateScreenshot(row.id,{state:"UPLOADING",error:undefined});
      try{
        let storageKey=row.storageKey,uploadToken=row.uploadToken;
        if(!row.putComplete||!storageKey||!uploadToken){
          const grant=await apiFetch<{
            storageKey:string;uploadToken:string;uploadUrl:string;
            requiredHeaders:Record<string,string>;
          }>(endpoint,{method:"POST",headers:{"content-type":"application/json"},
            body:JSON.stringify({action:"INITIATE",fileName:row.file.name,
              contentType:row.file.type,sizeBytes:row.file.size})});
          const put=await fetch(grant.uploadUrl,{method:"PUT",headers:grant.requiredHeaders,body:row.file});
          if(!put.ok)throw Error("Private upload failed. Retry this image.");
          storageKey=grant.storageKey;uploadToken=grant.uploadToken;
          // Keep only the storage identity for idempotent confirmation retry.
          // Never store a presigned URL or secret in the autosaved form draft.
          updateScreenshot(row.id,{storageKey,uploadToken,putComplete:true});
        }
        await apiFetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({action:"CONFIRM",storageKey,fileName:row.file.name,uploadToken})});
        updateScreenshot(row.id,{state:"UPLOADED",error:undefined});
      }catch(caught){
        const message=caught instanceof FriendlyFetchError&&caught.status===503
          ?"Storage unavailable. The issue was saved; retry the screenshot later."
          :caught instanceof Error&&caught.message.startsWith("Private upload")?caught.message
          :"The screenshot could not be attached. Retry it without recreating the issue.";
        updateScreenshot(row.id,{state:"FAILED",error:message});
      }
    }
    uploadLock.current=false;setUploading(false);
  }

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
      // Use only origin+pathname. Never persist URLs with token, search or
      // fragment secrets in a tracker diagnostic payload.
      sourceUrl:window.location.origin+window.location.pathname,
      sourcePath:window.location.pathname.slice(0,500),
      browser:window.navigator.userAgent.slice(0,500),
      viewport:(window.innerWidth+"x"+window.innerHeight).slice(0,64),
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
    // Flush the last keystroke before the network request begins; do not
    // discard a draft on validation failure, provider error or link retry.
    flushDraft();
    submitLock.current=true;
    setPending(true); setError("");
    try {
      const retryKey=retryKeyRef.current??crypto.randomUUID();
      retryKeyRef.current=retryKey;
      const payload=await apiFetch<{issue:{publicId:string}}>("/api/tracker/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": retryKey },
        body: JSON.stringify(parsed.data),
      });
      retryKeyRef.current=null;
      clearDraft();
      setRecentContext({reporterName:draft.reporterName,
        accountRole:draft.accountRole,environment:draft.environment});
      setCreated(payload.issue.publicId);
      // A failure to attach one image must not recreate or lose the report.
      void uploadScreenshots(payload.issue.publicId);
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
    if(!canSearchSimilar||similarQuery.trim().length<15)return;
    const generation=++similarRequest.current;
    setSimilarLoading(true);setSimilarError("");setSimilarResults([]);setSimilarSearched(false);
    try{
      const params=new URLSearchParams({q:similarQuery.trim().slice(0,100),limit:"5",sort:"newest"});
      const result=await apiFetch<{items:{publicId:string;description:string;status:string}[]}>(
        "/api/tracker/issues?"+params.toString(),{cache:"no-store"});
      if(generation!==similarRequest.current)return;
      setSimilarResults((result.items??[]).slice(0,5));setSimilarSearched(true);
    }catch{
      if(generation===similarRequest.current)
        setSimilarError("Related issues are temporarily unavailable. You can still submit your report.");
    }finally{
      if(generation===similarRequest.current)setSimilarLoading(false);
    }
  }
  // Legacy related-issue lookup runs after a short description debounce.
  // Ignore late responses when the user changes text or another search wins.
  useEffect(()=>{
    if(!canSearchSimilar)return;
    const phrase=draft.description.trim().slice(0,100);
    const generation=++similarRequest.current;
    if(phrase.length<15){
      setSimilarResults([]);setSimilarSearched(false);setSimilarLoading(false);
      return;
    }
    const timer=window.setTimeout(()=>{
      setSimilarQuery(phrase);
      setSimilarLoading(true);setSimilarError("");
      const params=new URLSearchParams({q:phrase,limit:"5",sort:"newest"});
      void apiFetch<{items:{publicId:string;description:string;status:string}[]}>(
        "/api/tracker/issues?"+params.toString(),{cache:"no-store"})
        .then(result=>{
          if(generation!==similarRequest.current)return;
          setSimilarResults((result.items??[]).slice(0,5));setSimilarSearched(true);
        })
        .catch(()=>{
          if(generation!==similarRequest.current)return;
          setSimilarError("Related issues are temporarily unavailable. You can still report.");
          setSimilarSearched(false);
        })
        .finally(()=>{if(generation===similarRequest.current)setSimilarLoading(false);});
    },500);
    return ()=>{window.clearTimeout(timer);similarRequest.current++;};
  },[canSearchSimilar,draft.description]);

  function onFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  }

  if (created) return (
    <section className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-white p-6" aria-live="polite">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl font-semibold text-success">✓</span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Issue reported</span>
        <StatusBadge tone="success">Saved</StatusBadge>
      </div>
      <h1 className="font-semibold text-2xl leading-8 text-[var(--lms-heading)]">{created}</h1>
      <p className="text-sm text-body leading-[22px]">The issue is saved. You can continue testing immediately.</p>
      <p className="text-sm text-muted-foreground" role="status">Screenshots: {screenshots.filter(row=>row.state==="UPLOADED").length}
        {" "}of {screenshots.length} attached{uploading?" · Uploading…":""}.</p>
      {screenshots.length?<ul className="space-y-2" aria-label="Screenshot upload receipts">
        {screenshots.map(row=><li key={row.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="min-w-0 break-all">{row.file.name}</span>
          <StatusBadge tone={row.state==="UPLOADED"?"success":row.state==="FAILED"?"warning":"neutral"}>{row.state}</StatusBadge>
          {row.error?<span role="alert" className="text-error">{row.error}</span>:null}
        </li>)}
      </ul>:null}
      {screenshots.some(row=>row.state==="FAILED")?
        <Button type="button" variant="secondary" disabled={uploading}
          onClick={()=>void uploadScreenshots(created)}>Retry failed screenshot uploads</Button>:null}
      {linkIssueError?<InlineNotice tone="error" message={linkIssueError}/>:null}
      {knownErrorId&&linkIssueError?<Button type="button"
        variant="secondary"
        onClick={()=>void linkCreatedIssue(created)}>Retry linking Known Error</Button>:null}

      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-white px-4 text-[14px] font-[650] text-[var(--lms-body-text)] transition-colors duration-[150ms] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none" href={(canSearchSimilar?"/tracker/issues/":"/tracker/mine/") + encodeURIComponent(created)}>View issue</Link>
        <Button disabled={uploading}
          onClick={() => {setCreated("");setDraft({...initial,...recentContext});clearDraft();setError("");clearScreenshots();}}
          type="button" className="min-h-11 md:min-h-9">Report another</Button>
      </div>
    </section>
  );

  return (
    <form onSubmit={submit} onKeyDown={onFormKeyDown}
      className="space-y-5 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 md:p-6">
      {restored?<Banner tone="info" action={<Button type="button" variant="secondary" onClick={()=>{setDraft(initial);clearDraft();}}>Discard draft</Button>}>
        Unsaved report restored.
      </Banner>:null}
      {dirty?<p className="text-xs text-muted-foreground leading-[20px]">Unsaved changes are kept on this device until your report is submitted.</p>:null}
      {error ? <InlineNotice tone="error" message={error}/> : null}
      <div className="grid gap-4 min-[768px]:grid-cols-3">
        <label className={label}>Reporter
          <Input className={field} name="reporterName" required maxLength={120}
            placeholder="Your signed-in account display name"
            autoComplete="name" value={draft.reporterName}
            onChange={event=>patch("reporterName",event.target.value)}/>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">Must match your signed-in account. Other names cannot submit on your behalf.</span>
        {fieldErrors["reporterName"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["reporterName"]}</span>:null}
        </label>
        <label className={label}>Account used
          <Select className={field} name="accountRole" required value={draft.accountRole} onChange={event=>patch("accountRole",event.target.value)}>
            <option value="" disabled>Select account</option>
            {ACCOUNT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors["accountRole"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["accountRole"]}</span>:null}
        </label>
        <label className={label}>Environment
          <Select className={field} name="environment" required value={draft.environment} onChange={event=>patch("environment",event.target.value)}>
            <option value="" disabled>Select environment</option>
            {ENVIRONMENT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors["environment"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["environment"]}</span>:null}
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
            {fieldErrors["page"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["page"]}</span>:null}
          </label>
          <label className={label}>Screen
            <Select className={field} required={Boolean(selectedPage?.children?.length)}
              disabled={!selectedPage?.children?.length}
              value={screen} onChange={event => setDraft(current=>({...current,screen:event.target.value,section:""}))}>
              <option value="">Select screen</option>
              {selectedPage?.children?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {fieldErrors["screen"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["screen"]}</span>:null}
          </label>
          <label className={label}>Section
            <Select className={field} name="section" key={page + ":" + screen}
              required={Boolean(selectedScreen?.children?.length)} disabled={!selectedScreen?.children?.length} value={draft.section}
              onChange={event=>patch("section",event.target.value)}>
              <option value="">Select section</option>
              {selectedScreen?.children?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {fieldErrors["section"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["section"]}</span>:null}
          </label>
        </div>
      </fieldset>
      <div className="grid gap-4 min-[768px]:grid-cols-3">
        <label className={label + " min-[768px]:col-span-2"}>What kind of issue?
          <Select className={field} name="issueType" required value={draft.issueType} onChange={event=>patch("issueType",event.target.value)}>
            <option value="" disabled>Search issue type</option>
            {ISSUE_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </label>
        <label className={label}>Severity
          <Select className={field} name="severity" value={draft.severity} onChange={event=>patch("severity",event.target.value)} required>
            {SEVERITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        {fieldErrors["severity"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["severity"]}</span>:null}
        </label>
      </div>
      <label className={label}>What went wrong?
        <Textarea className={field + " max-h-80 resize-y overflow-y-auto"} style={{minHeight:144}} name="description" required maxLength={4000} rows={5}
          value={draft.description} onChange={event=>{
            patch("description",event.target.value);
            const element=event.currentTarget;
            element.style.height="auto";
            element.style.height=Math.min(element.scrollHeight,320)+"px";
          }}
          placeholder="Example: I opened Lesson 3 and the lesson content kept loading without showing anything." />
        <span className="mt-1 block text-xs font-normal text-muted-foreground" aria-live="polite">{draft.description.length}/4000 characters</span>
        {fieldErrors["description"]?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors["description"]}</span>:null}
      </label>
      <section className="min-w-0 space-y-2 border-b border-border pb-4" aria-label="Screenshots and optional evidence">
        <h2 className="text-sm font-semibold text-[var(--lms-heading)]">Screenshots</h2>
        <div className="rounded-[var(--lms-control-radius)] border border-dashed border-border bg-[var(--lms-neutral-50)] p-4 text-sm text-muted-foreground"
          onDragOver={event=>event.preventDefault()}
          onDrop={event=>{event.preventDefault();addScreenshots(Array.from(event.dataTransfer.files));}}
          onPaste={event=>{const files=Array.from(event.clipboardData.files);
            if(files.length){event.preventDefault();addScreenshots(files);}}}>
          <input ref={screenshotInputRef} type="file" multiple aria-label="Choose screenshots"
            accept="image/png,image/jpeg,image/webp" className="sr-only"
            onChange={event=>{addScreenshots(Array.from(event.target.files??[]));event.target.value="";}} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" disabled={screenshots.length>=3||pending}
              onClick={()=>screenshotInputRef.current?.click()}>Choose screenshots</Button>
            <span>Drag, paste or choose up to 3 screenshots (PNG/JPEG/WebP, 8 MB each).</span>
          </div>
          {screenshots.length?<ul className="mt-3 grid gap-3 sm:grid-cols-2" aria-label="Selected screenshots">
            {screenshots.map(row=><li key={row.id} className="min-w-0 space-y-2 rounded border border-border bg-white p-2">
              <img src={row.preview} alt={"Screenshot preview: "+row.file.name}
                className="h-28 w-full rounded object-contain"/>
              <p className="truncate text-xs" title={row.file.name}>{row.file.name}</p>
              <Button type="button" variant="ghost" disabled={pending}
                onClick={()=>removeScreenshot(row.id)}>Remove screenshot</Button>
            </li>)}
          </ul>:null}
          <p role="status" className="mt-2">{screenshotStatus}</p>
        </div>
        <label className={label + " mt-2"}>Evidence link
          <Input className={field} name="evidenceLink" type="url" maxLength={1000} placeholder="https://…" value={draft.evidenceLink} onChange={event=>patch("evidenceLink",event.target.value)}/>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Optional — use this for a screen recording, Drive file, or other useful http/https link.
          </span>
        </label>
        <p className="text-xs text-muted-foreground">For privacy, never publish private screenshots via an unrestricted URL.</p>
      </section>
      {canSearchSimilar ? <>
      <details aria-label="Similar issues" className="min-w-0 border-y border-border py-4" open={Boolean(similarQuery.trim())}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Similar issues</summary>
        <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Search previously reported issues by a short phrase. Only reports you are allowed to read appear here.</p>
        <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
          <Input aria-label="Find similar issues by keyword" type="search" value={similarQuery}
            onChange={event=>{setSimilarQuery(event.target.value);setSimilarSearched(false);setSimilarError("");}}
            maxLength={100} placeholder="e.g. Quiz submission"
            className={field+" h-11 min-w-0 w-full basis-full md:w-55 md:basis-auto md:flex-none"}/>
          <Button type="button" onClick={()=>void checkSimilar()}
            disabled={similarLoading||similarQuery.trim().length<15} loading={similarLoading}
            variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">
            {similarLoading?"Searching…":"Find similar issues"}
          </Button>
        </div>
        {similarLoading?<p role="status" className="mt-2 text-xs text-muted-foreground">Checking for similar reports…</p>:null}
        {similarError?<InlineNotice tone="error" message={similarError}/>:null}
        {similarSearched&&similarResults.length?<div role="status" className="mt-2 text-sm">
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground leading-[20px]">Draft saves automatically · Paste screenshots anywhere once private uploads are available · Ctrl/⌘ + Enter to submit.</p>
        <Button disabled={pending} loading={pending} type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">
          {pending ? "Reporting…" : "Report issue"}
        </Button>
      </div>
    </form>
  );
}
