import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/messages/notifications/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-messages-notifications-01 /tpo/messages/notifications",()=>{
  it("preserves canonical destination",()=>{
    expect(source).toContain("redirect(");
  });
});
