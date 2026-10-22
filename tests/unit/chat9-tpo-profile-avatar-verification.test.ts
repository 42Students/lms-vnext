import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const component=readFileSync(join(process.cwd(),"src/components/tpo/tpo-profile-avatar.tsx"),"utf8");

describe("TPO profile photo: legacy square avatar with accessible editing",()=>{
 it("keeps the 120px photo and fallback rather than exposing a broken image",()=>{
  expect(component).toContain('className="relative h-[120px] w-[120px]"');
  expect(component).toContain('onError={()=>{setPreview(null);setError(');
  expect(component).toContain('aria-label={name+"\'s profile photo is unavailable"}');
 });
 it("provides keyboard-accessible 44px editing and image-link controls",()=>{
  expect(component).toContain('aria-label="Change profile photo"');
  expect(component).toContain("flex h-11 w-11 items-center justify-center rounded-full");
  expect(component).toContain("min-h-11 items-center text-left");
  expect(component).toContain("focus-visible:outline-2");
  expect(component).toContain('type="file" accept="image/png,image/jpeg,image/webp"');
 });
 it("does not publish an unscanned upload or drop optimistic version checking",()=>{
  expect(component).toContain("setPendingKey(response.grant.objectKey)");
  expect(component).toContain("Confirm photo after scan");
  expect(component).toContain("expectedVersion:version");
  expect(component).toContain('role="alert"');
 });
});
