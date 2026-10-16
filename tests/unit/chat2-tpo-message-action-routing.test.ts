import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("TPO-inbox-team-02 message actions",()=>{
 const path="src/app/api/placements/tpo/messages/threads";
 it("requires same origin and explicit POST for replies",()=>{
  const route=readFileSync(path+"/[threadId]/messages/route.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("sendThreadMessage(context,id.data,input.data.body)");
  expect(route).not.toContain("export async function GET");
 });
 it("only acknowledges on confirmed POST",()=>{
  const route=readFileSync(path+"/[threadId]/read/route.ts","utf8");
  expect(route).toContain("confirmed:z.literal(true)");
  expect(route).toContain("export async function POST");
  expect(route).not.toContain("export async function GET");
 });
});
