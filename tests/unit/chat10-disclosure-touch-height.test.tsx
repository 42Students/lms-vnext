import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {Disclosure} from "@/components/ui/disclosure";

describe("CI10UX native disclosure touch and keyboard surface",()=>{
 it("keeps a 44px minimum in default disclosure without extra controls",()=>{
  const html=renderToStaticMarkup(<Disclosure title="Section"><p>Details</p></Disclosure>);
  expect(html).toContain("<summary");
  expect(html).toContain('style="min-height:44px"');
  expect(html).toContain("Details");
  expect(html).toContain("group-open:rotate-180");
  expect(html).toContain("focus-visible:outline-2");
 });
 it("retains custom rich summaries and caller spacing without a duplicate arrow",()=>{
  const html=renderToStaticMarkup(<Disclosure
    title={<span>Lesson one</span>}
    preserveSummary summaryClassName="px-4 py-4 md:px-5"
    defaultOpen><p>Lesson content</p></Disclosure>);
  expect(html).toContain('style="min-height:44px"');
  expect(html).toContain("px-4 py-4 md:px-5");
  expect(html).toContain("Lesson content");
  expect(html).not.toContain("group-open:rotate-180");
 });
});
