import Link from "next/link";
import {notFound} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoDriveDiscussion} from "@/modules/placements/tpo-drive-discussion-service";
import {getDriveChangeRequestDiscussionContext,getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
import {TpoDriveTalkPrototype} from "@/components/tpo/tpo-drive-talk-prototype";
import {AuthorizationError} from "@/modules/permissions/policy";
import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
import {PlacementsServiceError} from "@/modules/placements/errors";

export default async function TpoDriveDiscussion({params,searchParams}:{
 params:Promise<{jobId:string}>;
 searchParams:Promise<{requestId?:string|string[];thread?:string|string[]}>;
}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 let data:Awaited<ReturnType<typeof getTpoDriveDiscussion>>;
 try{data=await getTpoDriveDiscussion(context,jobId)}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error}
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const query=await searchParams;
 const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 const badSelection=[query.requestId,query.thread].some(value=>
  Array.isArray(value)||(typeof value==="string"&&!uuid.test(value)));
 if(badSelection)return <section className="space-y-3">
  <PageHeader title="Drive Talk"/>
  <Alert tone="error">Invalid or repeated conversation selection. No unrelated recruiter messages were opened.</Alert>
  <Link href={root+"/discussion"} className="inline-flex min-h-11 items-center font-semibold text-link underline">Clear selection</Link>
 </section>;
 const requestId=typeof query.requestId==="string"?query.requestId:null;
 const selectedId=typeof query.thread==="string"?query.thread:null;
 const request=requestId?await getDriveChangeRequestDiscussionContext(context,jobId,requestId):null;
 const changeData=await getDriveChangeRequests(context,jobId)
  .catch(error=>{if(error instanceof AuthorizationError)throw error;return null;});
 const quote=request?[
   "Change request "+request.id,
   request.fieldLabel+": "+request.proposedValue.slice(0,1200),
   ...(request.reason?["Reason: "+request.reason.slice(0,600)]:[]),
  ].join("\n"):undefined;
 return <div className="min-w-0 space-y-4">
  <PageHeader title={data.job.title+" · Discussion"}
    description="Conversations with recruiters attached to this drive. Private team notes are not shared with recruiters."
    actions={<Link href={root} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Back to drive</Link>}/>
  {requestId?<div role="status" className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm">
    <p className="font-semibold">{request?"Discuss change request · "+request.fieldLabel:"Change request unavailable"}</p>
    {request?<p className="mt-1 break-words whitespace-pre-wrap text-body">{request.proposedValue}</p>:null}
    <Link href={root+"/change-requests#change-request-"+encodeURIComponent(requestId)}
      className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">View change request</Link>
    {request?<p className="mt-1 text-xs text-muted-foreground">Choose a recruiter conversation below, then select Quote change request to include its context.</p>:null}
   </div>:null}
  {!data.available?<Alert tone="warning">
   Recruiter conversation records are unavailable. Existing drive and team workflows remain accessible; no missing messages were assumed.
  </Alert>:
  <TpoDriveTalkPrototype jobId={jobId} threads={data.threads}
   selectedId={selectedId} requestId={requestId} actorUserId={context.user.id}
   changes={changeData?.requests.map(row=>({
    id:row.id,fieldLabel:row.fieldLabel,status:row.status,
    proposerParty:row.proposerParty,proposedValue:row.proposedValue,
    reason:row.reason,createdAt:row.createdAt,
   }))??[]}
   changesReady={changeData?.storageReady===true}
   {...(quote===undefined?{}:{quote})}/>}
  <p className="text-xs text-muted-foreground leading-5">Recruiter messages and internal team notes are separate. Only recorded messages appear here.</p>
  <p className="text-sm leading-6 text-body">
   Each drive also has an internal team discussion in Team conversations.{" "}
   <Link href="/tpo/team?filter=drives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Open drive team conversations</Link>
  </p>
 </div>;
}
