import {expect,it} from "vitest";
import {parseAuthTestAllowlist} from "@/modules/messaging/allowlist";
it("rejects malformed emails from test-only allowlist config",()=>{
 const list=parseAuthTestAllowlist({emailAddresses:"valid@example.org,a..b@example.org,.foo@example.org,bad@example..org"});
 expect(list.testEmails).toEqual(["valid@example.org"]);
});
it("normalizes repeated allowlisted recipients without expanding real-send scope",()=>{
 const list=parseAuthTestAllowlist({emailAddresses:"Staff+Jobs@Example.org, staff+jobs@example.org"});
 expect(list.testEmails).toEqual(["staff+jobs@example.org"]);
});
