import { describe, expect, it } from "vitest";
import { contrastRatio, LMS_AA } from "@/lib/ux-contrast";
import { readFileSync } from "node:fs";

describe("UX-AUDIT B-01/B-05/B-06 canonical LMS AA pairings",()=>{
 it("UX-PLAYBOOK-10 dark on primary and hover exceeds 4.5:1",()=>{
  expect(contrastRatio(LMS_AA.ink,LMS_AA.teal)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(LMS_AA.ink,LMS_AA.hover)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(LMS_AA.white,LMS_AA.teal)).toBeLessThan(4.5);
 });
 it("UX-PLAYBOOK-11 links use deep teal on light surfaces",()=>{
  expect(contrastRatio(LMS_AA.link,LMS_AA.white)).toBeGreaterThanOrEqual(4.5);
 });
 it("UX-PLAYBOOK-12 both themes keep a white on-primary semantic on the solid teal button",()=>{
  const css=readFileSync("src/app/globals.css","utf8");
  expect(css).toContain("--lms-primary: #26bac7");
  expect(css).toContain("--lms-on-primary: #ffffff");
  expect(css).toContain("--lms-button-primary: #0a7c88");
  expect(css).toContain("--primary: var(--lms-button-primary)");
  expect(css).toContain("--primary-foreground: var(--lms-on-primary)");
  expect(css).toContain("--color-on-primary: var(--primary-foreground)");
  expect(css).toContain("--lms-link-text: #0e7c87");
  expect(css).toContain("--lms-link-text: #75dce3");
 });
});
