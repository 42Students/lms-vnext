import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createTpoLead} from "@/modules/placements/tpo-crm-service";
import {
  createTpoCampaignDraft,getTpoCampaignDraft,listTpoCampaignDrafts,
} from "@/modules/messaging/tpo-campaign-draft-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.TEST_DATABASE_URL===process.env.DATABASE_URL &&
  process.env.DB09_TPO_API_READY==="DB09_VERIFIED";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});

const tpo:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const previousSecret=process.env.TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET;

describe.skipIf(!enabled)("TPO-campaigns-public-01/02 registered 0103 draft persistence",()=>{
  it("persists a tenant-scoped campaign draft with only registered columns",async()=>{
    process.env.TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET="test-only-campaign-recipient-secret-long-enough-2026";
    const suffix=randomUUID();
    const lead=await createTpoLead(tpo,{
      collegeId:SEED_IDS.collegeA,
      name:"Campaign 0103 "+suffix,
      email:"campaign-"+suffix+"@example.org",
    });
    expect(lead.id).toBeTruthy();
    const title="Registered draft "+suffix;
    const draft=await createTpoCampaignDraft(tpo,{
      title,subject:"Campus recruitment",
      body:"Hello {name}, apply to {company}.",segment:"NEW",
      templateKey:"tpo-campaign-general",
    });
    expect(draft.status).toBe("DRAFT");
    expect(draft.recipients).toBeGreaterThan(0);

    const stored=await getTpoCampaignDraft(tpo,draft.campaignId);
    expect(stored?.title).toBe(title);
    expect(stored?.subject).toBe("Campus recruitment");
    expect(stored?.body).toBe("Hello {name}, apply to {company}.");
    expect(stored?.sender_name).toBeTruthy();
    expect(stored?.sent).toBe(0);
    expect(stored?.failed).toBe(0);
    expect(stored?.skipped).toBe(0);

    const listed=await listTpoCampaignDrafts(tpo);
    expect(listed.ready).toBe(true);
    expect(listed.rows.some(row=>row.campaign_id===draft.campaignId)).toBe(true);
    // A saved draft never claims provider dispatch or sends an email.
  });
});
afterAll(async()=>{
  if(previousSecret===undefined)delete process.env.TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET;
  else process.env.TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET=previousSecret;
  await closeDatabaseConnection();
});
