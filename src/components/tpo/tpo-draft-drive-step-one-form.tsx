"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {tpoDriveFormErrorMessage} from "@/modules/placements/tpo-drive-form-error-copy";
import {Button} from "@/components/ui/button";

type Company = { relationshipId: string; name: string };
type Season = { id: string; name: string; startDate: string; endDate: string };

export function TpoDraftDriveStepOneForm({
  season,
  companies,
}: {
  season: Season;
  companies: readonly Company[];
}) {
  const router = useRouter();
  const [companyRelationshipId, setCompanyRelationshipId] = useState(
    companies[0]?.relationshipId ?? "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employmentType, setEmploymentType] = useState<"FULL_TIME" | "INTERNSHIP" | "CONTRACT">("FULL_TIME");
  const [workMode, setWorkMode] = useState<"ONSITE" | "REMOTE" | "HYBRID">("ONSITE");
  const [deadline, setDeadline] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [unknownCreate,setUnknownCreate] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || unknownCreate || !companyRelationshipId || title.trim().length < 3 || !description.trim()) {
      setError("Choose a company and provide a role title and description.");
      return;
    }
    // datetime-local is intentionally interpreted as Asia/Kolkata wall-clock,
    // not the browser's machine zone or an unqualified date string.
    let deadlineWithOffset: string | null = null;
    try{deadlineWithOffset=deadline?driveDeadlineIstToIso(deadline):null;}
    catch{setError("Enter a valid application deadline in IST.");return;}
    if (deadlineWithOffset && (!Number.isFinite(Date.parse(deadlineWithOffset)) ||
      Date.parse(deadlineWithOffset) <= Date.now())) {
      setError("The application deadline must be a future date and time in IST.");
      return;
    }
    if (!window.confirm(
      "Save " + title.trim() + " as a DRAFT for " +
      (companies.find((company) => company.relationshipId === companyRelationshipId)?.name ?? "this company") +
      "? This creates one primary role option. It does not publish the drive.",
    )) return;
    setPending(true);
    setError("");
    try {
      const body=await apiFetch<{id:string;status:string}>("/api/placements/tpo/drives/draft",{
        method:"POST",credentials:"same-origin",timeoutMs:30000,
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          confirmed:true,seasonId:season.id,companyRelationshipId,
          title:title.trim(),description:description.trim(),
          employmentType,workMode,applicationDeadline:deadlineWithOffset,
        }),
      });
      if(!body?.id)throw new Error("Could not verify that this draft was saved. Check Drives before retrying.");
      router.push("/tpo/placements/jobs/" + encodeURIComponent(body.id));
      router.refresh();
    } catch (cause) {
      if(cause instanceof FriendlyFetchError&&[0,499,504].includes(cause.status)){
        setUnknownCreate(true);
        setError("The create request may have succeeded. Check Drives before retrying to avoid a duplicate.");
      }else setError(tpoDriveFormErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }
  const cls = "mt-1";
  return (
    <form onSubmit={(event) => void submit(event)}
      className="space-y-5 border-b border-border pb-5">
      <p className="text-sm text-body leading-[22px]">
        Active season: <strong>{season.name}</strong> ({season.startDate} to {season.endDate}).
        You can add other role options, compensation, targeting and rounds in the draft workspace.
      </p>
      <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
        Company relationship
        <Select className={cls} value={companyRelationshipId}
          onChange={(event) => setCompanyRelationshipId(event.target.value)} disabled={pending}>
          {companies.map((company) => (
            <option key={company.relationshipId} value={company.relationshipId}>{company.name}</option>
          ))}
        </Select>
      </label>
      <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
        Initial role / drive title
        <Input className={cls} required minLength={3} maxLength={100}
          value={title} disabled={pending}
          onChange={(event) => setTitle(event.target.value)}/>
      </label>
      <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
        Role description
        <Textarea className={cls} required rows={4} maxLength={20000}
          value={description} disabled={pending}
          onChange={(event) => setDescription(event.target.value)}/>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Employment type
          <Select className={cls} value={employmentType} disabled={pending}
            onChange={(event) => setEmploymentType(event.target.value as typeof employmentType)}>
            <option value="FULL_TIME">Full time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
          </Select>
          <p className="mt-1 text-xs font-normal text-muted-foreground">Employment type is not the college job-type catalogue. Custom or hidden historical types cannot be selected here yet; edit the drive after creation when its supported classification becomes available.</p>
        </label>
        <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Work mode
          <Select className={cls} value={workMode} disabled={pending}
            onChange={(event) => setWorkMode(event.target.value as typeof workMode)}>
            <option value="ONSITE">On site</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </Select>
        </label>
      </div>
      <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
        Application deadline (optional, IST)
        <Input className={cls} type="datetime-local" value={deadline}
          disabled={pending} onChange={(event) => setDeadline(event.target.value)}/>
      </label>
      {error ? <p role="alert" className="text-sm text-error leading-[22px]">{error}</p> : null}
      {unknownCreate?<p role="alert" className="text-sm text-body leading-[22px]">Review <Link href="/tpo/placements/lifecycle" className="text-primary-text underline">Drives</Link> before creating again. <Button type="button" variant="link" className="min-h-11 max-[767px]:min-h-11" onClick={()=>setUnknownCreate(false)}>I checked for duplicates</Button></p>:null}
      <Button type="submit" disabled={pending || unknownCreate || !companyRelationshipId}
        >
        {pending ? "Saving draft…" : "Review and save draft"}
      </Button>
    </form>
  );
}
