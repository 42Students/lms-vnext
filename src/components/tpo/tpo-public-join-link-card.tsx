"use client";

import { useState } from "react";
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
  const [domainDraft,setDomainDraft]=useState("");
  const [feedback, setFeedback] = useState("");
  const isCompany = scope === "COMPANY";
  const title = isCompany ? PUBLIC_JOIN_LINK_COPY.company : PUBLIC_JOIN_LINK_COPY.college;

  async function makeLink() {
    const action = status.link ? "REPLACE" : "CREATE";
    if (action === "REPLACE" && !window.confirm(
      PUBLIC_JOIN_LINK_COPY.replaceTitle + "\n" +
      PUBLIC_JOIN_LINK_COPY.replaceExplanation + "\n" +
      PUBLIC_JOIN_LINK_COPY.replaceConfirm,
    )) return;
    setFeedback("");
    setBusy(true);
    try {
      const response = await fetch("/api/placements/tpo/public-join-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope, ...(isCompany ? { companyId } : {}),
          action, confirmed: true,
        }),
      });
      if (!response.ok) throw new Error("LINK_CHANGE_FAILED");
      const data: { path: string; status: TpoPublicJoinLinkStatus } = await response.json();
      setStatus(data.status);
      setFreshUrl(window.location.origin + data.path);
      setFeedback(action === "REPLACE" ? "New link made" : "Link made");
    } catch {
      setFeedback(isCompany ? "Couldn't make the link" : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  async function saveDomain(){
    if(!companyId)return;
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
    finally{setBusy(false);}
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
    <section aria-label={title} className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {isCompany ? (
        <>
          {status.domain ? (
            <p className="mt-2 text-sm text-body">
              Anyone at <strong>{status.domain}</strong> joins your placements through this link, with their work email. Other emails can&apos;t use it.
            </p>
          ) : (
            <p className="mt-2 text-sm text-body">
              We don&apos;t know {companyName ?? "this company"}&apos;s email domain yet. Add it, so only their people can join.
            </p>
          )}
          {status.domain ? <p className="mt-2 text-sm text-body">Email domains: @{status.domain}</p> :
          companyId ? <div className="mt-3 flex flex-wrap gap-2">
           <input aria-label="Company email domain" value={domainDraft} onChange={event=>setDomainDraft(event.target.value)}
            placeholder="company.com" className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm"/>
           <button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
            disabled={busy||!domainDraft.trim()} onClick={()=>void saveDomain()}>Add domain</button>
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
        </p>
      ) : (
        <>
          {status.link ? (
            <p className="mt-3 text-sm text-body">
              Made {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(status.link.createdAt))}. Opened {status.link.opensCount} times, {status.link.joinsCount} joined.
            </p>
          ) : null}
          <button
            type="button" disabled={busy || (isCompany && !status.domain)}
            onClick={makeLink}
            className="mt-4 min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.link ? PUBLIC_JOIN_LINK_COPY.replace :
              isCompany ? PUBLIC_JOIN_LINK_COPY.initial : PUBLIC_JOIN_LINK_COPY.publicInitial}
          </button>
          {freshUrl ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-body">{PUBLIC_JOIN_LINK_COPY.once}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input aria-label={title} readOnly value={freshUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground" />
                <button type="button" onClick={copyLink}
                  className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-foreground">
                  Copy
                </button>
              </div>
            </div>
          ) : null}
          {feedback ? <p role="status" className="mt-2 text-sm text-body">{feedback}</p> : null}
        </>
      )}
    </section>
  );
}
