import { expect, it } from "vitest";
import { learnerNoticeFilterHref } from "@/modules/placements/learner-notices-navigation-model";
it("keeps chronological sort while toggling pinned, recency and personal unread filters", () => {
 const base={pinned:false,unread:false,recent:false,q:"registration",sort:"oldest" as const};
 for(const changed of [{pinned:true},{recent:true},{unread:true}]) {
  const url=new URL(learnerNoticeFilterHref({...base,...changed}),"https://example.test");
  expect(url.searchParams.get("sort")).toBe("oldest");
  expect(url.searchParams.get("q")).toBe("registration");
  expect(url.searchParams.get(Object.keys(changed)[0])).toBe("1");
  expect(url.searchParams.has("page")).toBe(false);
 }
});
