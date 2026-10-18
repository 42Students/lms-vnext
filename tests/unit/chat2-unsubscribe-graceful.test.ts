import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Public unsubscribe confirmations",()=>{
 it("TPO-campaigns-public-16 shows a retryable inline error, not raw JSON form navigation",()=>{
  const ui=src("src/components/placements/campaign-unsubscribe-confirm.tsx");
  const page=src("src/app/campaign-unsubscribe/[token]/page.tsx");
  expect(page).toContain("<CampaignUnsubscribeConfirm token={token} cell={cell}/>");
  expect(ui).toContain('method:"POST",body:data,credentials:"same-origin"');
  expect(ui).toContain('role="alert"');
  expect(ui).toContain("That didn't work. Please try again.");
  expect(ui).toContain("pendingRef.current");
  expect(ui).toContain("12000");
 });
 it("TPO-campaigns-public-R09 stays on the form if storage unavailable or delivery not confirmed",()=>{
  const ui=src("src/components/placements/campaign-unsubscribe-confirm.tsx");
  expect(ui).toContain("!response.ok||!response.redirected");
  expect(ui).toContain('url.pathname!=="/campaign-unsubscribe/confirmed"');
  expect(ui).toContain('router.push(url.pathname+url.search)');
  expect(ui).toContain("setError");
 });
 it("TPO-campaigns-public-16 permits idempotent used signed tokens, but rejects unverified ones",()=>{
  const route=src("src/app/api/public/campaign-unsubscribe/route.ts");
  expect(route).toContain('if(!claim)return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400})');
  const service=src("src/modules/messaging/tpo-campaign-unsubscribe-service.ts");
  expect(service).toContain('if(decision!=="APPLY")return decision');
  expect(service).toContain('if(outcome==="DENY")throw new CampaignUnsubscribeInvalid()');
  expect(route).toContain('CampaignUnsubscribeInvalid');
  expect(route).toContain('scope=placement-cell');
  expect(route).toContain("isSameOriginRequest(request)");
 });
});
