import {describe,expect,it} from "vitest";
import {COMPANY_SHARE_EMAILS_PER_HOUR,companyShareEmailThrottle}
 from "@/modules/placements/company-share/email-code-throttle-model";

describe("company-share email challenge throttle",()=>{
 const now=new Date("2026-10-22T12:00:00.000Z");
 const ago=(minutes:number)=>new Date(now.getTime()-minutes*60_000);
 it("uses the legacy five-per-hour threshold per share",()=>{
  expect(COMPANY_SHARE_EMAILS_PER_HOUR).toBe(5);
  expect(companyShareEmailThrottle([ago(10),ago(20),ago(30),ago(40)],now)).toBeNull();
  expect(companyShareEmailThrottle([ago(10),ago(20),ago(30),ago(40),ago(50)],now))
   .toBe("LIMITED");
 });
 it("prefers the one-minute warning, including at the hourly cap",()=>{
  expect(companyShareEmailThrottle([ago(0.5)],now)).toBe("TOO_SOON");
  expect(companyShareEmailThrottle([ago(0.5),ago(10),ago(20),ago(30),ago(40)],now))
   .toBe("TOO_SOON");
  expect(companyShareEmailThrottle([ago(1)],now)).toBeNull();
 });
 it("ignores events outside the hour and rejects a broken clock",()=>{
  expect(companyShareEmailThrottle([ago(60),ago(70),ago(80),ago(90),ago(100)],now)).toBeNull();
  expect(()=>companyShareEmailThrottle([],new Date(Number.NaN))).toThrow("Invalid share-email clock");
 });
});
