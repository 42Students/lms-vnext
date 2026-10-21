"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useEffect, useRef, useState } from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {
  PUBLIC_JOIN_LINK_COPY, type TpoPublicJoinLinkStatus,
} from "@/modules/placements/tpo-public-join-link-model";

export function TpoPublicJoinLinkCard({
  initial, scope, companyId, companyName,
}: {
  initial: TpoPublicJoinLinkStatus;
  scope: "COMPANY" | "COLLEGE";
  companyId?: string;
  companyName?: string;
}) {
  const [status, setStatus] = useState(initial);
  const [freshUrl, setFreshUrl] = useState("");
  const [postDirect,setPostDirect]=useState<boolean|null>(null);
  const [postError,setPostError]=useState("");
  const [busy, setBusy] = useState(false);
  const actionInFlight=useRef(false);
  const [domainDraft,setDomainDraft]=useState("");
  const [feedback, setFeedback] = useState("");
  const [replaceOpen,setReplaceOpen] = useState(false);
  const isCompany = scope === "COMPANY";
  const title = isCompany ? PUBLIC_JOIN_LINK_COPY.company : PUBLIC_JOIN_LINK_COPY.college;

  async function makeLink() {
    const action = status.link ? "REPLACE" : "CREATE";
    if(action==="REPLACE"&&!status.link?.id){setFeedback("Refresh the join link status and try again.");return;}
    if(actionInFlight.current)return;
    actionInFlight.current=true;
    setFeedback("");
    setBusy(true);
    try {
      const response = await fetch("/api/placements/tpo/public-join-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope, ...(isCompany ? { companyId } : {}),
          action, confirmed: true,
          ...(action==="REPLACE"?{expectedLinkId:status.link?.id}:{}),
        }),
      });
      if (!response.ok) {
        const body=await response.json().catch(()=>null) as {error?:string}|null;
        if(body?.error==="DOMAIN_REQUIRED")
          throw new Error("Add the company's email domain first, so only its people can join.");
        if(body?.error==="STALE")
          throw new Error("The join link changed. Refresh and try again.");
        if(body?.error==="NOT_FOUND")
          throw new Error("The company relationship was not found in your college.");
        throw new Error("Couldn't make the link");
      }
      const data: { path: string; status: TpoPublicJoinLinkStatus } = await response.json();
      setStatus(data.status);
      setFreshUrl(window.location.origin + data.path);
      setFeedback(action === "REPLACE" ? "New link made. The old link stopped working." : "Link made");
      setPostDirect(null);
      setReplaceOpen(false);
    } catch(error) {
      setFeedback(error instanceof Error?error.message:"Couldn't make the link");
    } finally {
      actionInFlight.current=false;
      setBusy(false);
    }
  }

  async function retryStatus(){
    if(actionInFlight.current)return;
    actionInFlight.current=true;
    setBusy(true);setFeedback("");
    try{
      const query=new URLSearchParams({scope,...(isCompany&&companyId?{companyId}:{})});
      const response=await fetch("/api/placements/tpo/public-join-links/status?"+query.toString(),{
        credentials:"same-origin",cache:"no-store",
      });
      if(!response.ok)throw new Error("Couldn't load the company link");
      const state=await response.json() as TpoPublicJoinLinkStatus;
      setStatus(state);
      setFreshUrl("");
    }catch{setFeedback("Couldn't load the company link");}
    finally{actionInFlight.current=false;setBusy(false);}
  }
  useEffect(()=>{
    // A name-keyed Company Memory can render before the scoped link summary
    // arrives. Fetch its current link and domain automatically, rather than
    // presenting a false broken-link warning until the user presses Retry.
    if(!initial.ready)void retryStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scope,companyId,initial.ready]);
  async function saveDomain(){
    if(!companyId||actionInFlight.current)return;
    actionInFlight.current=true;
    setBusy(true);setFeedback("");
    try{
      const response=await fetch("/api/placements/tpo/companies/"+encodeURIComponent(companyId)+"/domain",{
       method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domain:domainDraft}),
      });
      const payload=await response.json() as {domain?:string;error?:string};
      if(!response.ok)throw new Error(payload.error==="DOMAIN_IN_USE"?
       "That domain belongs to another company.":payload.error==="ALREADY_SET"?
       "A domain is already saved for this company.":"Couldn't add the domain");
      setStatus(prev=>({...prev,domain:payload.domain??prev.domain}));
      setFeedback("Domain added");
    }catch(error){setFeedback(error instanceof Error?error.message:"Couldn't add the domain");}
    finally{actionInFlight.current=false;setBusy(false);}
  }
  async function toggleLink() {
    if(!status.link||actionInFlight.current)return;
    if(!status.link.id){setFeedback("Refresh the join link status and try again.");return;}
    actionInFlight.current=true;
    setBusy(true);setFeedback("");
    try{
      const response=await fetch("/api/placements/tpo/public-join-links/enabled",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({scope,...(isCompany?{companyId}:{}),expectedLinkId:status.link.id,enabled:!status.link.enabled}),
      });
      const data=await response.json() as {enabled?:boolean;error?:string};
      if(!response.ok)throw new Error(data.error==="NOT_REGISTERED"?"Join link storage is unavailable.":
       data.error==="STALE"?"The join link changed. Refresh and try again.":"Couldn't save");
      setStatus(prev=>({...prev,link:prev.link?{...prev.link,enabled:data.enabled===true}:null}));
      setFeedback("Link setting saved");
    }catch(error){setFeedback(error instanceof Error?error.message:"Couldn't save");}
    finally{actionInFlight.current=false;setBusy(false);}
  }
  useEffect(()=>{
    if(!status.ready||!status.link?.id){setPostDirect(null);return;}
    const controller=new AbortController(),currentLinkId=status.link.id;
    const query=new URLSearchParams({scope,...(isCompany&&companyId?{companyId}:{})});
    void fetch("/api/placements/tpo/public-join-links/posting-policy?"+query.toString(),{
      credentials:"same-origin",cache:"no-store",signal:controller.signal,
    }).then(async response=>{
      if(!response.ok)throw new Error("Couldn't load posting policy");
      return response.json() as Promise<{linkId:string;postDirect:boolean}>;
    }).then(result=>{
      if(!controller.signal.aborted&&result.linkId===currentLinkId){
        setPostDirect(result.postDirect);setPostError("");
      }
    }).catch(()=>{
      if(!controller.signal.aborted){setPostDirect(null);setPostError("Couldn't load posting policy");}
    });
    return ()=>controller.abort();
  },[scope,companyId,isCompany,status.ready,status.link?.id]);

  async function togglePostDirect(){
    if(!status.link?.id||postDirect===null||busy||actionInFlight.current)return;
    actionInFlight.current=true;setBusy(true);setPostError("");
    try{
      const response=await fetch("/api/placements/tpo/public-join-links/posting-policy",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({scope,...(isCompany?{companyId}:{}),
          expectedLinkId:status.link.id,postDirect:!postDirect}),
      });
      const result=await response.json().catch(()=>null) as
        {postDirect?:boolean;error?:string}|null;
      if(!response.ok||typeof result?.postDirect!=="boolean")
        throw new Error(result?.error==="STALE"?"The link changed. Refresh and try again.":"Couldn't save");
      setPostDirect(result.postDirect);setFeedback("Saved");
    }catch(reason){
      setPostError(reason instanceof Error?reason.message:"Couldn't save");
    }finally{actionInFlight.current=false;setBusy(false);}
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(freshUrl);
      setFeedback(PUBLIC_JOIN_LINK_COPY.copied);
    } catch {
      setFeedback(PUBLIC_JOIN_LINK_COPY.copyError);
    }
  }

  return (
    <section aria-label={title} className="min-w-0 space-y-3 border-t border-border pt-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {isCompany ? (
        <>
          {status.domain ? (
            <p className="mt-2 text-sm text-body">
              Anyone at <strong>{companyName??status.domain}</strong> joins your placements through this link, with their work email. Other emails can&apos;t use it.
            </p>
          ) : (
            <p className="mt-2 text-sm text-body">
              We don&apos;t know {companyName ?? "this company"}&apos;s email domain yet. Add it, so only their people can join.
            </p>
          )}
          {status.domain ? <p className="mt-2 text-sm text-body">Email domains: @{status.domain}</p> :
          companyId ? <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
           <Input aria-label="Company email domain" value={domainDraft} onChange={event=>{setDomainDraft(event.target.value);setFeedback("");}}
            placeholder="company.com" className="min-h-11 min-w-0 w-full md:min-h-9"/>
           <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
            disabled={busy||!domainDraft.trim()} onClick={()=>void saveDomain()}>Add domain</Button>
          </div> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-body">
          Anyone with a verified business email can join your placement cell through this link.
        </p>
      )}
      {!status.ready ? (
        <div role="status" className="mt-3 flex min-w-0 flex-col items-start gap-2 text-sm text-body sm:flex-row sm:items-center">
          <p className="m-0">{isCompany ? "Couldn't load the company link" : "Couldn't load the public link"}</p>
          <Button type="button" variant="ghost" disabled={busy} onClick={()=>void retryStatus()}
            className="min-h-11 w-full underline sm:w-auto min-[768px]:min-h-9">Retry</Button>
        </div>
      ) : (
        <>
          {status.link ? (
            <p className="mt-3 text-sm text-body">
              Made {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(status.link.createdAt))}. Opened {status.link.opensCount} times, {status.link.joinsCount} joined.
            </p>
          ) : null}
          {status.link&&!freshUrl?<p className="mt-2 text-xs text-muted-foreground">
            This link was made before links could be shown again. It still works where you shared it.
            Make a new link to copy it for invitations; the old one then stops working.
          </p>:null}
          {!isCompany&&status.link?<div className="space-y-2 border-t border-border pt-3">
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-body">
              <Checkbox checked={postDirect===true} disabled={busy||postDirect===null}
                onChange={()=>void togglePostDirect()}/>
              Anyone with a verified business email may post
            </label>
            <p className="text-sm text-body">{postDirect
              ? "On: drive requests may arrive as drafts without your approval. You still publish them. Only while the link is on."
              : "Off: their drive requests wait for your approval, like everyone else's."}</p>
            {postError?<p role="alert" className="text-sm text-error">{postError} <Button type="button" variant="ghost" onClick={()=>void retryStatus()}>Retry</Button></p>:null}
          </div>:null}
          {status.link?<label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-body">
            <Checkbox checked={status.link.enabled} disabled={busy}
              onChange={()=>void toggleLink()}/>
            {status.link.enabled?"Link is on":"Link is off"}
          </label>:null}
          <Button
            type="button" disabled={busy || (isCompany && !status.domain)}
            onClick={()=>{if(status.link)setReplaceOpen(true);else void makeLink();}}
            className="mt-4 min-h-11 w-full sm:w-auto min-[768px]:min-h-9"
          >
            {status.link ? PUBLIC_JOIN_LINK_COPY.replace :
              isCompany ? PUBLIC_JOIN_LINK_COPY.initial : PUBLIC_JOIN_LINK_COPY.publicInitial}
          </Button>
          {freshUrl ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-body">{PUBLIC_JOIN_LINK_COPY.once}</p>
              <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <Input aria-label={title} readOnly value={freshUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-h-11 min-w-0 w-full md:min-h-9" />
                <Button type="button" variant="secondary" disabled={busy} onClick={copyLink}
                  className="min-h-11 w-full sm:w-auto min-[768px]:min-h-9">
                  Copy
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
      {feedback ? <p role="status" className="min-w-0 break-words border-l-2 border-border px-3 py-2 text-sm text-body">{feedback}</p> : null}
      <ConfirmDialog open={replaceOpen} onOpenChange={next=>{if(!busy)setReplaceOpen(next);}}
        title={PUBLIC_JOIN_LINK_COPY.replaceTitle} description={PUBLIC_JOIN_LINK_COPY.replaceExplanation}
        confirmVariant="primary" confirmLabel={PUBLIC_JOIN_LINK_COPY.replaceConfirm}
        pending={busy} onConfirm={()=>{void makeLink();}}>
        {feedback?<p role="alert" className="text-sm text-error">{feedback}</p>:null}
      </ConfirmDialog>
    </section>
  );
}
