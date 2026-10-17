import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {reconcileLatestDiscussionPage} from "@/components/courses/learner-course-discussion-model";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("chat-5 final sprint: Faculty course discussions",()=>{
 it("FAC-courses-R05 protects unsent drafts on browser reload and same-origin course navigation without blocking hash/modified clicks",()=>{
  const page=source("src/components/courses/learner-course-discussion.tsx");
  expect(page).toContain('window.addEventListener("beforeunload",guard)');
  expect(page).toContain('document.addEventListener("click",guard,true)');
  expect(page).toContain('!draft.trim()&&!posting');
  expect(page).toContain('event.metaKey||event.ctrlKey||event.shiftKey||event.altKey');
  expect(page).toContain('href.startsWith("#")');
  expect(page).toContain('window.confirm("Discard your unsent discussion message?")');
  expect(page).toContain("event.preventDefault()");
 });
 it("FAC-courses-R06 preserves latest successfully fetched discussion messages and exposes retry on refresh failure even when posting permission is revoked",()=>{
  const page=source("src/components/courses/learner-course-discussion.tsx");
  const staleBannerGate=page.match(/\{loadError\s*&&[^\n]*\?\s*\(/)?.[0]??"";
  expect(staleBannerGate).toContain("loadError");
  expect(staleBannerGate).toContain("loadedOnce.current");
  expect(staleBannerGate).toContain("messages.length > 0");
  expect(page).toContain("Discussion refresh failed. Could not refresh the discussion. Showing the last messages we loaded.");
  expect(page).toContain("Retry discussion refresh");
  expect(page).toContain("onClick={() => void load(true)}");
  expect(page.indexOf(staleBannerGate)).toBeLessThan(page.indexOf("{pinned ? ("));
  expect(page).toContain('reconcileLatestDiscussionPage(previous, incoming, received.length)');
  expect(page).toContain('if (learnerDiscussionRefreshIsCurrent(refreshId,latestRefreshId.current))');
 });
 it("FAC-courses-R06 discards deleted recent messages while preserving older history on authoritative full-page refresh",()=>{
  const previous=[
   {id:"old",createdAtExact:"2099-01-01T00:00:00.000001+00:00"},
   {id:"deleted",createdAtExact:"2099-01-03T00:00:30.000001+00:00"},
   {id:"new",createdAtExact:"2099-01-03T00:00:35.000001+00:00"},
  ];
  const latest=[
   {id:"new",createdAtExact:"2099-01-03T00:00:35.000001+00:00"},
   {id:"added",createdAtExact:"2099-01-04T00:00:00.000001+00:00"},
  ];
  expect(reconcileLatestDiscussionPage(previous,latest,2).map(x=>x.id)).toEqual(["new","added"]);
  const full=[...Array.from({length:60},(_,i)=>({id:"n"+i,createdAtExact:"2099-01-03T00:00:"+String(i).padStart(2,"0")+".000001+00:00"}))];
  expect(reconcileLatestDiscussionPage(previous,full,60).map(x=>x.id)).toContain("old");
  expect(reconcileLatestDiscussionPage(previous,full,60).map(x=>x.id)).not.toContain("deleted");
 });
});