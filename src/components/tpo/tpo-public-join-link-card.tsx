"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useRef, useState } from "react";
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
        throw new Error("Couldn't make the link. Check your access and try again.");
      }
      const data: { path: string; status: TpoPublicJoinLinkStatus } = await response.json();
      setStatus(data.status);
      setFreshUrl(window.location.origin + data.path);
      setFeedback(action === "REPLACE" ? "New link made" : "Link made");
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
       "A domain is already saved for this company.":"Couldn't add domain");
      setStatus(prev=>({...prev,domain:payload.domain??prev.domain}));
      setFeedback("Email domain added");
    }catch(error){setFeedback(error instanceof Error?error.message:"Couldn't add domain");}
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
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(freshUrl);
      setFeedback(PUBLIC_JOIN_LINK_COPY.copied);
    } catch {
      setFeedback(PUBLIC_JOIN_LINK_COPY.copyError);
    }
  }

  return (
    <section aria-label={title} className="border-t border-border pt-5">
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
          companyId ? <div className="mt-3 flex flex-wrap gap-2">
           <Input aria-label="Company email domain" value={domainDraft} onChange={event=>setDomainDraft(event.target.value)}
            placeholder="company.com" className="min-h-11 sm:min-h-9 min-w-0 flex-1"/>
           <Button type="button" variant="secondary" className="min-h-11 sm:min-h-9"
            disabled={busy||!domainDraft.trim()} onClick={()=>void saveDomain()}>Add domain</Button>
          </div> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-body">
          Anyone with a verified business email can join your placement cell through this link.
        </p>
      )}
      {!status.ready ? (
        <p role="status" className="mt-3 text-sm text-body">
          {isCompany ? "Couldn't load the company link" : "Couldn't load the public link"}
          <Button type="button" variant="ghost" disabled={busy} onClick={()=>void retryStatus()}
            className="ml-3 min-h-11 sm:min-h-9 underline">Retry</Button>
        </p>
      ) : (
        <>
          {status.link ? (
            <p className="mt-3 text-sm text-body">
              Made {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(status.link.createdAt))}. Opened {status.link.opensCount} times, {status.link.joinsCount} joined.
            </p>
          ) : null}
          {status.link?<label className="mt-3 flex items-center gap-3 text-sm text-body">
            <Checkbox checked={status.link.enabled} disabled={busy}
              onChange={()=>void toggleLink()}/>
            Link is on
          </label>:null}
          <Button
            type="button" disabled={busy || (isCompany && !status.domain)}
            onClick={()=>{if(status.link)setReplaceOpen(true);else void makeLink();}}
            className="mt-4 min-h-11 sm:min-h-9"
          >
            {status.link ? PUBLIC_JOIN_LINK_COPY.replace :
              isCompany ? PUBLIC_JOIN_LINK_COPY.initial : PUBLIC_JOIN_LINK_COPY.publicInitial}
          </Button>
          {freshUrl ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-body">{PUBLIC_JOIN_LINK_COPY.once}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input aria-label={title} readOnly value={freshUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1" />
                <Button type="button" variant="secondary" onClick={copyLink}
                  className="min-h-11 sm:min-h-9">
                  Copy
                </Button>
              </div>
            </div>
          ) : null}
          {feedback ? <p role="status" className="mt-2 text-sm text-body">{feedback}</p> : null}
        </>
      )}
      <ConfirmDialog open={replaceOpen} onOpenChange={setReplaceOpen}
        title={PUBLIC_JOIN_LINK_COPY.replaceTitle} description={PUBLIC_JOIN_LINK_COPY.replaceExplanation}
        confirmVariant="primary" confirmLabel={PUBLIC_JOIN_LINK_COPY.replaceConfirm}
        pending={busy} onConfirm={()=>{setReplaceOpen(false);void makeLink();}} />
    </section>
  );
}
