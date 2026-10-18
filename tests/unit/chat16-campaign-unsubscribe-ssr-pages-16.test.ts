import {beforeEach,describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {campaignUnsubscribeTokenKind} from "@/modules/placements/public-unsubscribe-preview-service";
import CampaignUnsubscribePage from "@/app/campaign-unsubscribe/[token]/page";
import ConfirmedUnsubscribePage from "@/app/campaign-unsubscribe/confirmed/page";

vi.mock("@/modules/placements/public-unsubscribe-preview-service",()=>({
 campaignUnsubscribeTokenKind:vi.fn(),
}));
vi.mock("@/components/placements/campaign-unsubscribe-confirm",()=>({
 CampaignUnsubscribeConfirm:(props:{token:string;cell:boolean})=>
  createElement("section",{"data-confirm":"true","data-token":props.token,
   "data-cell":String(props.cell)},"Requires explicit POST"),
}));
const token="signed-token-value";
const page=()=>CampaignUnsubscribePage({params:Promise.resolve({token})});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue("GLOBAL");
});

describe("chat-16 public campaign unsubscribe server pages",()=>{
 it("UX-campaign-unsubscribe-page-16 never persists suppression on GET and shows a separate explicit confirmation",async()=>{
  const html=renderToStaticMarkup(await page());
  expect(campaignUnsubscribeTokenKind).toHaveBeenCalledExactlyOnceWith(token);
  expect(html).toContain("Opening this link does not unsubscribe you");
  expect(html).toContain('data-confirm="true"');
  expect(html).toContain('data-cell="false"');
  expect(html).toContain('data-token="'+token+'"');
  expect(html).not.toContain("You\u0027re unsubscribed");
 });
 it("UX-campaign-unsubscribe-page-17 preserves purpose-scoped placement cell copy, not global suppression claims",async()=>{
  vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue("PLACEMENT_CELL");
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("The placement cell that wrote to you will not email you again.");
  expect(html).toContain('data-confirm="true"');
  expect(html).toContain('data-cell="true"');
  expect(html).not.toContain("global email suppression list");
 });
 it("UX-campaign-unsubscribe-page-18 invalid or expired tokens never render any enabled confirmation",async()=>{
  vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue(null);
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("This confirmation link is invalid or expired. No preference was changed.");
  expect(html).not.toContain('data-confirm="true"');
  expect(html).toContain('role="alert"');
 });
 it("UX-campaign-unsubscribe-page-19 transient verifier errors render Retry without exposing provider data",async()=>{
  vi.mocked(campaignUnsubscribeTokenKind).mockRejectedValue(new Error("secret-provider-message"));
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("We couldn&#x27;t check this confirmation link right now.");
  expect(html).toContain('href="/campaign-unsubscribe/'+token+'"');
  expect(html).not.toContain("secret-provider-message");
  expect(html).not.toContain('data-confirm="true"');
 });
 it("UX-campaign-unsubscribe-page-20 confirmation display is URL-scope-specific and does not call verifier again",async()=>{
  const global=renderToStaticMarkup(await ConfirmedUnsubscribePage({
   searchParams:Promise.resolve({scope:"global"}),
  }));
  const cell=renderToStaticMarkup(await ConfirmedUnsubscribePage({
   searchParams:Promise.resolve({scope:"placement-cell"}),
  }));
  expect(global).toContain("Transactional account messages may use separate preferences.");
  expect(cell).toContain("This placement cell will not email you again.");
  expect(global).toContain('role="status"');
  expect(cell).toContain('href="/"');
  expect(campaignUnsubscribeTokenKind).not.toHaveBeenCalled();
 });
});
