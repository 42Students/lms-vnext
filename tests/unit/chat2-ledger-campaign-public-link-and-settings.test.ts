import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {campaignRecipientDisposition,assertCampaignRecipientCap,planTpoCampaignRecipients,TPO_CAMPAIGN_MAX_RECIPIENTS} from "@/modules/messaging/tpo-campaign-send-policy";
import {issueTpoCampaignRecipientToken,verifyTpoCampaignRecipientToken,matchesCampaignRecipient,campaignUnsubscribeDecision,resolveTpoCampaignRecipientSecret} from "@/modules/messaging/tpo-campaign-recipient-token";
import {previewTpoCampaignText,tpoCampaignDraftSchema,CAMPAIGN_DELIVERY_UNAVAILABLE} from "@/modules/messaging/tpo-campaign-draft-model";
import {campaignFilterSchema,campaignFilterHref} from "@/modules/messaging/campaign-filter-model";
import {publicJoinLinkPath,tpoPublicJoinLinkChangeSchema,tpoPublicJoinLinkToggleSchema,PUBLIC_JOIN_LINK_COPY} from "@/modules/placements/tpo-public-join-link-model";

const uuid="00000000-0000-4000-8000-000000000001";
const other="00000000-0000-4000-8000-000000000002";
const secret="this-is-a-purpose-specific-secret-at-least-32-bytes";
const claim={v:1 as const,collegeId:uuid,campaignId:other,recipientId:uuid,expiresAt:1234};
const recipient={collegeId:uuid,campaignId:other,id:uuid,unsubscribedAt:null};

describe("TPO-campaigns-public-12 / T-S2-04 campaign safety ledger",()=>{
 it("rechecks opt-outs, bounced addresses and Not-now prior to dispatch",()=>{
  const eligible={emailNorm:"a@example.com",unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"};
  expect(campaignRecipientDisposition(eligible)).toBe("ELIGIBLE");
  expect(campaignRecipientDisposition({...eligible,emailNorm:""})).toBe("NO_EMAIL");
  expect(campaignRecipientDisposition({...eligible,unsubscribedAt:new Date()})).toBe("UNSUBSCRIBED");
  expect(campaignRecipientDisposition({...eligible,inviteBouncedAt:new Date()})).toBe("BOUNCED");
  expect(campaignRecipientDisposition({...eligible,manualStage:"NOT_NOW"})).toBe("NOT_NOW");
 });
 it("deduplicates recipients by case-insensitive email without returning email addresses",()=>{
  const base={unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"};
  const plan=planTpoCampaignRecipients([
   {id:"a",emailNorm:"  A@Example.COM ",...base},
   {id:"b",emailNorm:"a@example.com",...base},
   {id:"c",emailNorm:null,...base},
   {id:"d",emailNorm:"D@example.com",...base},
  ]);
  expect(plan).toEqual({recipientIds:["a","d"],selectedCount:4,eligibleCount:2,
   suppressed:{NO_EMAIL:1,UNSUBSCRIBED:0,BOUNCED:0,NOT_NOW:0,DUPLICATE:1}});
  expect(JSON.stringify(plan)).not.toContain("@");
 });
 it("limits unique deliverable recipients while permitting large suppressed rosters",()=>{
  expect(TPO_CAMPAIGN_MAX_RECIPIENTS).toBe(500);
  expect(assertCampaignRecipientCap(500)).toBe(500);
  expect(()=>assertCampaignRecipientCap(501)).toThrow("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  expect(()=>assertCampaignRecipientCap(-1)).toThrow();
  expect(()=>assertCampaignRecipientCap(1.5)).toThrow();
  const skip=Array.from({length:499},(_,i)=>({id:String(i),emailNorm:"x@example.com",unsubscribedAt:new Date(),inviteBouncedAt:null,manualStage:"NEW"}));
  const plan=planTpoCampaignRecipients([...skip,{id:"allowed",emailNorm:"allowed@example.com",unsubscribedAt:null,inviteBouncedAt:null,manualStage:"NEW"}]);
  expect(plan.recipientIds).toEqual(["allowed"]);
  expect(plan.suppressed.UNSUBSCRIBED).toBe(499);
  expect(plan.selectedCount).toBe(500);
  expect(plan.eligibleCount).toBe(1);
  expect(()=>planTpoCampaignRecipients([...skip,...skip])).toThrow("TPO_CAMPAIGN_RECIPIENT_LIMIT");
 });
 it("uses 32-byte minimum purpose-specific HMAC tokens and locked row-identity checks",()=>{
  const token=issueTpoCampaignRecipientToken(claim,secret);
  expect(verifyTpoCampaignRecipientToken(token,secret,Date.now())).toEqual(claim);
  expect(verifyTpoCampaignRecipientToken(token,secret+"tampered",Date.now())).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token+"x",secret,Date.now())).toBeNull();
  expect(verifyTpoCampaignRecipientToken(token,secret,Number.NaN)).toBeNull();
  expect(()=>issueTpoCampaignRecipientToken(claim,"short")).toThrow("CAMPAIGN_RECIPIENT_SECRET_UNAVAILABLE");
  expect(matchesCampaignRecipient(claim,recipient)).toBe(true);
  expect(matchesCampaignRecipient(claim,{...recipient,id:other})).toBe(false);
  expect(campaignUnsubscribeDecision(claim,recipient)).toBe("APPLY");
  expect(campaignUnsubscribeDecision(claim,{...recipient,unsubscribedAt:new Date()})).toBe("ALREADY");
  expect(campaignUnsubscribeDecision(claim,{...recipient,collegeId:other})).toBe("DENY");
 });
 it("supports canonical signing secret preferentially over an older alias",()=>{
  expect(resolveTpoCampaignRecipientSecret({TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET:secret,TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:"different"})).toBe(secret);
  expect(resolveTpoCampaignRecipientSecret({TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET:secret})).toBe(secret);
 });
 it("validates controlled draft template and renders plain-text placeholders",()=>{
  expect(previewTpoCampaignText("Hello {name} at {company}",{name:"Ada",company:"Bluebird"})).toBe("Hello Ada at Bluebird");
  expect(()=>previewTpoCampaignText("x".repeat(10001),{name:"Ada",company:"Bluebird"})).toThrow("CAMPAIGN_BODY_TOO_LONG");
  const draft={title:"Opportunity",subject:"Hiring details",body:"Hello {name}",segment:"ALL_ELIGIBLE",templateKey:"__invalid__"};
  expect(tpoCampaignDraftSchema.safeParse(draft).success).toBe(false);
  expect(tpoCampaignDraftSchema.safeParse({...draft,selectedLeadIds:[uuid,uuid]}).success).toBe(false);
  expect(CAMPAIGN_DELIVERY_UNAVAILABLE).toContain("not enabled");
 });
 it("rejects invalid campaign filter routes and keeps search URL encoded",()=>{
  expect(campaignFilterSchema.safeParse({state:"ALL",page:1}).success).toBe(true);
  expect(campaignFilterSchema.safeParse({state:"INVALID"}).success).toBe(false);
  expect(campaignFilterSchema.safeParse({page:0}).success).toBe(false);
  expect(campaignFilterHref({state:"UNASSIGNED",page:2,search:"A & B"})).toContain("q=A+%26+B");
 });
 it("dispatch service requires verified provider and never reclaims an already-started draft",()=>{
  const s=readFileSync("src/modules/messaging/tpo-campaign-dispatch-service.ts","utf8");
  expect(s).toContain('process.env["TPO_CAMPAIGNS_READY"]!=="VERIFIED"');
  // Provider config now comes from the shared ZeptoMail reader, not direct env access.
  expect(s).toContain("readZeptoMailConfig()");
  expect(s).toContain("!mail.token.trim()");
  expect(s).toContain("isSecureMailProviderEndpoint(mail.apiUrl)");
  expect(s).toContain("provider===mail.otpTemplateKey");
  expect(s).toContain("assertPersistedPlatformPermission");
  expect(s).toContain('eq(placementTpoEmailCampaigns.status,"DRAFT")');
  expect(s).toContain('eq(placementTpoEmailCampaignRecipients.status,"PENDING")');
  expect(s).toContain('eq(placementTpoEmailCampaignRecipients.status,"QUEUED")');
  expect(s).toContain("campaignRecipientDisposition");
  expect(s).toContain("messagingDeliveryReceipts");
  expect(s).toContain('status:"SENDING"');
  expect(s).toContain('"ALREADY_STARTED"');
 });
 it("drafts snapshot college-scoped recipients and reject unprovisioned storage",()=>{
  const s=readFileSync("src/modules/messaging/tpo-campaign-draft-service.ts","utf8");
  expect(s).toContain("assertPersistedPlatformPermission");
  expect(s).toContain("planTpoCampaignRecipients");
  expect(s).toContain('"DB09_VERIFIED"');
  expect(s).toContain('"DRAFT"');
  expect(s).toContain("snapshot.suppressed");
  expect(s).toContain("collegeId:college.id");
  expect(s).toContain("resolveTpoCampaignRecipientSecret(process.env)");
 });
 it("recipient unsubscribe requires matching college campaign and lead under transaction lock",()=>{
  const s=readFileSync("src/modules/messaging/tpo-campaign-unsubscribe-service.ts","utf8");
  expect(s).toContain("verifyTpoCampaignRecipientToken");
  expect(s).toContain('eq(placementTpoEmailCampaignRecipients.collegeId,claim.collegeId)');
  expect(s).toContain('eq(placementTpoEmailCampaignRecipients.campaignId,claim.campaignId)');
  expect(s).toContain('.for("update")');
  expect(s).toContain("campaignUnsubscribeDecision");
  expect(s).toContain("inviteTokenHash:null");
  expect(s).toContain("activityEvents");
 });
});

describe("TPO-settings-audit-55 / public recruiter link ledger",()=>{
 it("requires explicit confirmation, valid scoped company, and valid toggle",()=>{
  expect(tpoPublicJoinLinkChangeSchema.safeParse({scope:"COLLEGE",action:"CREATE",confirmed:true}).success).toBe(true);
  expect(tpoPublicJoinLinkChangeSchema.safeParse({scope:"COLLEGE",action:"CREATE",confirmed:false}).success).toBe(false);
  expect(tpoPublicJoinLinkChangeSchema.safeParse({scope:"COMPANY",action:"REPLACE",confirmed:true}).success).toBe(false);
  expect(tpoPublicJoinLinkChangeSchema.safeParse({scope:"COMPANY",action:"REPLACE",confirmed:true,companyId:uuid}).success).toBe(false);
  expect(tpoPublicJoinLinkChangeSchema.safeParse({scope:"COMPANY",action:"REPLACE",confirmed:true,companyId:uuid,expectedLinkId:other}).success).toBe(true);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",enabled:false}).success).toBe(false);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",companyId:uuid,enabled:false}).success).toBe(false);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",companyId:uuid,enabled:false,expectedLinkId:other}).success).toBe(true);
 });
 it("builds scoped encoded URLs and preserves exact legacy public copy",()=>{
  expect(publicJoinLinkPath("COMPANY","abc/123")).toBe("/company-join/abc%2F123");
  expect(publicJoinLinkPath("COLLEGE","token")).toBe("/college-join/token");
  expect(PUBLIC_JOIN_LINK_COPY.college).toBe("Public link for recruiters");
  expect(PUBLIC_JOIN_LINK_COPY.replace).toBe("New link");
  expect(PUBLIC_JOIN_LINK_COPY.once).toContain("shown only once");
 });
 it("keeps college membership checks, transactional replacement and audit log",()=>{
  const s=readFileSync("src/modules/placements/tpo-public-join-link-service.ts","utf8");
  expect(s).toContain("requirePermission");
  expect(s).toContain("assertPersistedPlatformPermission");
  expect(s).toContain('context.user.platformStatus !== "ACTIVE"');
  expect(s).toContain('.for("update")');
  expect(s).toContain("randomBytes(32)");
  expect(s).toContain('tokenHash: createHash("sha256")');
  expect(s).toContain('eventType: "PLACEMENTS_PUBLIC_RECRUITER_LINK_CHANGED"');
  expect(s).toContain('eventType:"PLACEMENTS_PUBLIC_JOIN_LINK_ENABLED"');
  expect(s).toContain('"ALREADY_EXISTS"');
  expect(s).toContain('"STALE"');
  expect(s).toContain('existing.id!==input.expectedLinkId');
  expect(s).toContain('row.id!==input.expectedLinkId');
 });
 it("settings people read is active-membership and college scoped, not role-inferred",()=>{
  const s=readFileSync("src/modules/placements/tpo-settings-people-service.ts","utf8");
  expect(s).toContain("hasPlacementTeamMembership(context)");
  expect(s).toContain("context.membership?.collegeId !== collegeId");
  expect(s).toContain("requirePlacementManageScope(context, collegeId)");
  expect(s).toContain("teamAssignmentsAvailable");
  expect(s).toContain('"TPO_ADMIN"');
  expect(s).toContain('"FACULTY_COORDINATOR"');
  expect(s).toContain('"STUDENT_COORDINATOR"');
  expect(s).toContain("buildTpoTrustedDomains");
  expect(s).toContain("explicitDomainsAvailable");
 });
 it("communication settings update uses CAS, college lock and same-transaction audit",()=>{
  const s=readFileSync("src/modules/placements/tpo-communication-settings-service.ts","utf8");
  expect(s).toContain("requireTpoBatchActor(context)");
  expect(s).toContain('"TPO_SETTINGS_STALE"');
  expect(s).toContain("input.expectedVersion");
  expect(s).toContain('for("update")');
  expect(s).toContain("getDb().transaction");
  expect(s).toContain("activityEvents");
  expect(s).toContain("actorMembershipId:context.membership!.id");
 });
});
