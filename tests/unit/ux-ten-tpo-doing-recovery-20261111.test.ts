import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=(path:string)=>readFileSync(
  "src/app/(authenticated)/tpo/"+path+"/error.tsx","utf8",
);
describe("10 in-progress TPO UX groups — error recovery contracts",()=>{
  it("UX-G099: batch details retain a safe list exit and mobile retry",()=>{
    const s=route("batches/[batchId]");
    expect(s).toContain("Back to batches");
    expect(s).toContain('href="/tpo/batches"');
    expect(s).toContain("Retry batch");
    expect(s).toContain("does not mean that the batch has no registrations or classes");
    expect(s).toContain("min-h-11 w-full sm:w-auto");
  });
  it("UX-G104: a failed private conversation retains the thread context and inbox exit",()=>{
    const s=route("messages/[threadId]");
    expect(s).toContain("No missing or empty conversation is inferred.");
    expect(s).toContain('href="/tpo/messages"');
    expect(s).toContain("Retry conversation");
    expect(s).toContain("min-h-11 w-full sm:w-auto");
    expect(s).not.toContain("{error.message}");
  });
  it("UX-G110: draft drive error never invents employer or season choices",()=>{
    const s=route("placements/new/draft");
    expect(s).toContain("No empty selection is assumed.");
    expect(s).toContain("Retry draft");
    expect(s).toContain('href="/tpo/placements/new"');
    expect(s).toContain("min-h-11 w-full sm:w-auto");
  });
  it("UX-G111: recruiter failure does not present an unverified missing recruiter",()=>{
    const s=route("recruiters/[leadId]");
    expect(s).toContain("does not confirm that the recruiter is missing");
    expect(s).toContain("Retry details");
    expect(s).toContain('href="/tpo/recruiters"');
  });
  it("UX-G112: unavailable campaign preview cannot be mistaken for successful delivery",()=>{
    const s=route("recruiters/campaigns/preview");
    expect(s).toContain("No recipients have been confirmed");
    expect(s).toContain("Retry preview");
    expect(s).toContain('href="/tpo/recruiters/campaigns"');
  });
  it("UX-G115: pipeline recovery remains in the reports family with 44px mobile targets",()=>{
    const s=route("reports/season-pipeline");
    expect(s).toContain("does not mean zero placements");
    expect(s).toContain('href="/tpo/reports"');
    expect(s).toContain("min-h-11 w-full sm:w-auto");
  });
  it("UX-G116: branding failure never fabricates a logo or colour",()=>{
    const s=route("settings/branding");
    expect(s).toContain("No logo, colour, or fallback value has been inferred");
    expect(s).toContain("Retry branding");
    expect(s).toContain('href="/tpo/settings"');
  });
  it("UX-G117: public link read failure does not falsely imply unpublished state",()=>{
    const s=route("settings/public-link");
    expect(s).toContain("The link may still be active");
    expect(s).toContain("Retry link settings");
    expect(s).toContain('href="/tpo/settings"');
    expect(s).not.toContain("error.message");
  });
  it("UX-G118: template settings recover inside the private shell",()=>{
    const s=route("settings/templates");
    expect(s).toContain("insideShell homeHref=\"/tpo/settings\"");
    expect(s).not.toContain("error.message");
  });
  it("UX-G119: preparation staging has a safe students exit",()=>{
    const s=route("students/preparation-prep");
    expect(s).toContain("insideShell homeHref=\"/tpo/students\"");
    expect(s).not.toContain("error.message");
  });
});
