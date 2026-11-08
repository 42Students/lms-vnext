import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { learnerNoticeFilterHref, learnerNoticePageHref } from "@/modules/placements/learner-notices-navigation-model";

const defaults = { pinned: false, unread: false, recent: false, q: "" };

describe("learner notice tab navigation", () => {
  it("keeps update tab selected across personal alert filters", () => {
    const href = learnerNoticeFilterHref({
      ...defaults, show: "updates", unread: true, alertQ: "interview", recent: true, sort: "oldest",
    });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/learn/my-placements/announcements");
    expect(url.searchParams.get("show")).toBe("updates");
    expect(url.searchParams.get("unread")).toBe("1");
    expect(url.searchParams.get("alertQ")).toBe("interview");
    expect(url.searchParams.get("recent")).toBe("1");
    expect(url.searchParams.get("sort")).toBe("oldest");
  });

  it("does not change existing college notice navigation", () => {
    expect(learnerNoticeFilterHref(defaults)).toBe("/learn/my-placements/announcements");
    expect(learnerNoticePageHref({ ...defaults, page: 2 }))
      .toBe("/learn/my-placements/announcements?page=2");
  });

  it("retains update tab in all personal-alert links on the page", () => {
    const source = readFileSync(
      "src/app/(authenticated)/learn/my-placements/announcements/page.tsx", "utf8",
    );
    const updates = source.split('<section hidden={activeView!=="updates"}')[1];
    expect(updates).toBeDefined();
    expect(source).toContain('const tabHref=(target:"announcements"|"updates")=>learnerNoticeFilterHref({');
    expect(source).toContain("pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,");
    expect(source).toContain("q:queryText,alertQ,sort:sortKey,source,");
    const links = [...updates.matchAll(/learnerNoticeFilterHref\(\{([^}]*)\}\)/g)];
    expect(links).toHaveLength(4);
    expect(links.every((match) => match[1].includes('show:"updates"'))).toBe(true);
  });
});
