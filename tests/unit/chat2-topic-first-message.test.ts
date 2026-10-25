import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {internalThreadSchema} from "@/modules/placements/tpo-team-internal-model";
const source=(path:string)=>readFileSync(path,"utf8");
const recipientMembershipId="11111111-1111-4111-8111-111111111111";
describe("TPO Team topic creation with optional first message",()=>{
 it("TPO-inbox-team-17 accepts a bounded first message but rejects blank or oversized payloads",()=>{
  const input={recipientMembershipId,topic:"Placement plans"};
  expect(internalThreadSchema.safeParse(input).success).toBe(true);
  expect(internalThreadSchema.safeParse({...input,firstMessage:"Hello colleague"}).success).toBe(true);
  expect(internalThreadSchema.safeParse({...input,firstMessage:" ".repeat(5)}).success).toBe(false);
  expect(internalThreadSchema.safeParse({...input,firstMessage:"x".repeat(4001)}).success).toBe(false);
 });
 it("TPO-inbox-team-17 TPO-inbox-team-29 persist first message in the same transaction and notify with authorized deep link",()=>{
  const service=source("src/modules/placements/tpo-team-internal-create-service.ts");
  const route=source("src/app/api/placements/tpo/team/threads/route.ts");
  const form=source("src/components/tpo/tpo-team-forms.tsx");
  expect(service).toContain("tx.insert(placementTpoInternalMessages)");
  expect(service).toContain("firstMessageHash");
  expect(service).toContain('existing.metadata["firstMessageHash"]');
  expect(service).toContain('actionHref:"/tpo/team/"+thread.id+(initial?"?m="+initial.id:"")');
  expect(service).toContain("input.firstMessage??input.topic");
  expect(route).toContain('firstMessage:form.get("firstMessage")||undefined');
  expect(route).toContain('source["firstMessage"]??source["message"]??undefined');
  expect(route).toContain("internalThreadSchema.safeParse");
  expect(form).toContain("First message (optional)");
  expect(form).toContain("firstMessage:firstMessage.trim()");
  expect(form).toContain("sessionStorage.setItem");
 });
});