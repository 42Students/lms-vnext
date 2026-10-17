import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementApplications, placementJobs, placementOffers } from "@/db/schema";
import { placementDriveSelections } from "@/db/schema/placement-drive-selections";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { issuePlacementOffer, listPlacementOfferCandidates } from "./offer-service";
import {listPlacementRoleOptions} from "./role-option-service";
import { auditTpoJobChange, requireTpoJobActor, requireTpoJobCollege } from "./tpo-job-write-base";
import { placementJobIdSchema } from "./validation";
import { recordSelectionsSchema, releaseSelectionsSchema, summarizeSelectionRelease } from "./tpo-drive-selection-model";

const pendingCode = null;

async function scopedJob(context: RequestContext, rawJobId: unknown) {
  const collegeId = await requireTpoJobCollege(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const [job] = await getDb().select({
    id: placementJobs.id, title: placementJobs.title, status: placementJobs.status,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  return job;
}


export async function getTpoSelectionWorkspace(context: RequestContext, rawJobId: unknown) {
  const job = await scopedJob(context, rawJobId);
  const storageReady = true; // 0115 is registered on main
  const [candidates, roleOptions] = await Promise.all([
    listPlacementOfferCandidates(context, job.id),
    listPlacementRoleOptions(context, job.id),
  ]);
  const rows = storageReady ? await getDb().select({
    id: placementDriveSelections.id,
    jobId: placementDriveSelections.jobId,
    applicationId: placementDriveSelections.applicationId,
    roleTitle: placementDriveSelections.roleTitle,
    annualCtcInr: placementDriveSelections.annualCtcInr,
    status: placementDriveSelections.status,
    recordedAt: placementDriveSelections.recordedAt,
    releasedOfferId: placementDriveSelections.releasedOfferId,
  }).from(placementDriveSelections)
    .where(eq(placementDriveSelections.jobId,job.id))
    .orderBy(placementDriveSelections.recordedAt) : [];
  const candidateMap = new Map(candidates.map(row => [row.applicationId, row]));
  return { job, storageReady, pendingMessage: storageReady ? null : pendingCode,
    roleOptions: roleOptions.filter(r => r.status === "ACTIVE").map(r => ({
      id:r.id,title:r.title,annualCtcInr:r.maximumAnnualCtcInr ?? r.minimumAnnualCtcInr,
    })),
    candidates: candidates.map(row => ({
      applicationId: row.applicationId,
      name: row.displayName ?? "Learner",
      roleTitle: row.roleTitle,
      email: row.email,
      offerReady: row.offerReady,
      alreadyOffered: Boolean(row.offer && ["ISSUED","ACCEPTED"].includes(row.offer.status)),
    })),
    selections: rows.map(row => ({
      ...row,
      recordedAt: row.recordedAt.toISOString(),
      name: candidateMap.get(row.applicationId)?.displayName ?? "Learner",
      offerReady: candidateMap.get(row.applicationId)?.offerReady ?? false,
    })),
  };
}

/** Selection is recorded separately; nothing is sent to students in this step. */
export async function recordTpoDriveSelections(context: RequestContext, rawJobId: unknown, raw: unknown) {
  const job = await scopedJob(context, rawJobId);
  if (job.status !== "PUBLISHED") throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  const input = recordSelectionsSchema.parse(raw);
  const candidates = await listPlacementOfferCandidates(context, job.id);
  const ready = new Map(candidates.filter(item => item.offerReady &&
    !(item.offer && ["ISSUED","ACCEPTED"].includes(item.offer.status)))
    .map(item => [item.applicationId, item]));
  if (input.entries.some(entry => !ready.has(entry.applicationId))) {
    throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
  }
  return getDb().transaction(async tx => {
    await requireTpoJobActor(tx, context);
    const [locked] = await tx.select({status:placementJobs.status}).from(placementJobs)
      .where(eq(placementJobs.id,job.id)).for("share").limit(1);
    if (locked?.status !== "PUBLISHED") throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    const applications = await tx.select({id:placementApplications.id}).from(placementApplications)
      .where(and(eq(placementApplications.jobId, job.id),
        inArray(placementApplications.id,input.entries.map(e=>e.applicationId)),
        eq(placementApplications.status,"SUBMITTED"))).for("update");
    if (applications.length !== input.entries.length) throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
    const existing = await tx.select().from(placementDriveSelections)
      .where(inArray(placementDriveSelections.applicationId,input.entries.map(e=>e.applicationId)))
      .for("update");
    if (existing.some(row => row.jobId !== job.id || row.status !== "SELECTED")) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS");
    }
    const now=new Date();
    const recorded=[];
    for(const entry of input.entries) {
      const old=existing.find(row=>row.applicationId===entry.applicationId);
      const [saved]=old
        ? await tx.update(placementDriveSelections).set({
            roleTitle:entry.roleTitle,annualCtcInr:entry.annualCtcInr,recordedAt:now,updatedAt:now,
          }).where(and(eq(placementDriveSelections.id,old.id),eq(placementDriveSelections.status,"SELECTED")))
          .returning({id:placementDriveSelections.id})
        : await tx.insert(placementDriveSelections).values({
            jobId:job.id,applicationId:entry.applicationId,
            roleTitle:entry.roleTitle,annualCtcInr:entry.annualCtcInr,
            recordedByUserId:context.user.id,
          }).returning({id:placementDriveSelections.id});
      if(!saved)throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
      recorded.push(saved.id);
    }
    await auditTpoJobChange(tx,context,job,"PLACEMENTS_TPO_SELECTION_RECORDED","recorded selections for",{
      selectionIds:recorded,applicationIds:input.entries.map(e=>e.applicationId),
    });
    return {recorded:recorded.length,selectionIds:recorded};
  });
}

/**
 * Verify and release one selection at a time. The canonical offer issuer
 * performs the final eligibility, held-offer, deadline and concurrency checks.
 * Partial results are explicit. Successful offer issuance is idempotent on retry.
 */
export async function verifyAndReleaseTpoSelections(context:RequestContext,rawJobId:unknown,raw:unknown){
  const job=await scopedJob(context,rawJobId);
  if(job.status!=="PUBLISHED")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  const input=releaseSelectionsSchema.parse(raw);
  const candidateMap=new Map((await listPlacementOfferCandidates(context,job.id))
    .map(c=>[c.applicationId,c]));
  const results:Array<{selectionId:string;applicationId:string;status:"released"|"skipped";reason?:string;offerId?:string}>=[];
  for(const id of input.selectionIds){
    const [selection]=await getDb().select().from(placementDriveSelections)
      .where(and(eq(placementDriveSelections.id,id),eq(placementDriveSelections.jobId,job.id))).limit(1);
    if(!selection){results.push({selectionId:id,applicationId:"",status:"skipped",reason:"Selection is no longer available"});continue;}
    if(selection.status==="RELEASED"&&selection.releasedOfferId){
      results.push({selectionId:id,applicationId:selection.applicationId,status:"released",offerId:selection.releasedOfferId});continue;
    }
    if(selection.recordedAt.toISOString()!==input.expectedRecordedAt[id]){
      results.push({selectionId:id,applicationId:selection.applicationId,status:"skipped",reason:"Selection changed. Refresh before releasing."});continue;
    }
    const candidate=candidateMap.get(selection.applicationId);
    // A previous request can issue the canonical offer and time out before
    // marking the selection RELEASED. Reconcile the exact issued offer first.
    if(selection.status==="VERIFIED"&&candidate?.offer&&
      ["ISSUED","ACCEPTED"].includes(candidate.offer.status)&&
      candidate.offer.roleTitle===selection.roleTitle&&
      candidate.offer.annualCtcInr===selection.annualCtcInr){
      try{
        const offerId=candidate.offer.id;
        await getDb().transaction(async tx=>{
          await requireTpoJobActor(tx,context);
          const [updated]=await tx.update(placementDriveSelections).set({
            status:"RELEASED",releasedOfferId:offerId,releasedAt:new Date(),updatedAt:new Date(),
          }).where(and(eq(placementDriveSelections.id,id),
            eq(placementDriveSelections.status,"VERIFIED"),
            eq(placementDriveSelections.jobId,job.id))).returning({id:placementDriveSelections.id});
          if(!updated)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
          await auditTpoJobChange(tx,context,job,
            "PLACEMENTS_TPO_SELECTION_RELEASED","reconciled a verified selection for",{
              selectionId:id,applicationId:selection.applicationId,offerId,
            });
        });
        results.push({selectionId:id,applicationId:selection.applicationId,status:"released",offerId});
      }catch(error){
        results.push({selectionId:id,applicationId:selection.applicationId,status:"skipped",
          reason:error instanceof Error?error.message:"Offer release reconciliation failed"});
      }
      continue;
    }
    if(candidate?.offer&&["ISSUED","ACCEPTED"].includes(candidate.offer.status)){
      results.push({selectionId:id,applicationId:selection.applicationId,status:"skipped",reason:"An active offer already exists with different terms or an unreconciled selection. Review the offer before release."});continue;
    }
    if(!candidate?.offerReady){
      results.push({selectionId:id,applicationId:selection.applicationId,status:"skipped",reason:"Final round or eligibility check is not ready"});continue;
    }
    try{
      await getDb().transaction(async tx=>{
        await requireTpoJobActor(tx,context);
        const [locked]=await tx.select().from(placementDriveSelections)
          .where(and(eq(placementDriveSelections.id,id),eq(placementDriveSelections.jobId,job.id)))
          .for("update").limit(1);
        if(!locked||locked.recordedAt.toISOString()!==input.expectedRecordedAt[id]||
          !["SELECTED","VERIFIED"].includes(locked.status))throw new Error("Selection changed");
        if(locked.status==="SELECTED"){
          await tx.update(placementDriveSelections).set({
            status:"VERIFIED",verifiedAt:new Date(),verifiedByUserId:context.user.id,updatedAt:new Date(),
          }).where(eq(placementDriveSelections.id,id));
          await auditTpoJobChange(tx,context,job,"PLACEMENTS_TPO_SELECTION_VERIFIED","verified a selection for",{
            selectionId:id,applicationId:locked.applicationId,
          });
        }
      });
      const offer=await issuePlacementOffer(context,selection.applicationId,{
        kind:"OFFER",roleTitle:selection.roleTitle,annualCtcInr:selection.annualCtcInr,
      });
      await getDb().transaction(async tx=>{
        await requireTpoJobActor(tx,context);
        const [updated]=await tx.update(placementDriveSelections).set({
          status:"RELEASED",releasedOfferId:offer.id,releasedAt:new Date(),updatedAt:new Date(),
        }).where(and(eq(placementDriveSelections.id,id),eq(placementDriveSelections.status,"VERIFIED")))
          .returning({id:placementDriveSelections.id});
        if(!updated)throw new Error("Offer issued but selection status needs reconciliation");
        await auditTpoJobChange(tx,context,job,"PLACEMENTS_TPO_SELECTION_RELEASED","released a verified selection for",{
          selectionId:id,applicationId:selection.applicationId,offerId:offer.id,
        });
      });
      results.push({selectionId:id,applicationId:selection.applicationId,status:"released",offerId:offer.id});
    }catch(error){
      results.push({selectionId:id,applicationId:selection.applicationId,status:"skipped",
        reason:error instanceof Error?error.message:"Offer could not be released"});
    }
  }
  return {...summarizeSelectionRelease(results),results};
}
