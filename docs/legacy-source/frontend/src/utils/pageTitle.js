import { adminRouteTitles, routeTitles } from "@/common/constant";
import { tpoNavigationMenu } from "@/common/lists";

export const titleizeRouteSegment = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  return value
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\.\.\./g, "")
    .split(/[-_\s/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

// TPO pages are titled with the sidebar's own names ("Placement eligibility", "Engage"), detail pages included.
const TPO_TITLES = Object.fromEntries((tpoNavigationMenu?.() || []).map((item) => [item.path, item.modulename]));

export const getDashboardPageTitle = (pathname, activeMenuItem) => {
  const tpoSection = /^\/tpo\/([^/?#]+)/.exec(String(pathname || ""))?.[1];
  if (tpoSection && TPO_TITLES[tpoSection]) return TPO_TITLES[tpoSection];
  const explicitTitle = routeTitles?.[activeMenuItem] || adminRouteTitles?.[activeMenuItem];
  if (explicitTitle) return explicitTitle;

  const segments = String(pathname || "")
    .split("/")
    .filter((segment) => segment && !segment.startsWith("["));
  const lastMeaningfulSegment = [...segments].reverse().find((segment) => !segment.startsWith("["));
  return titleizeRouteSegment(lastMeaningfulSegment);
};

export const getBrowserTitle = (pathname, activeMenuItem) => {
  const pageTitle = getDashboardPageTitle(pathname, activeMenuItem);
  return pageTitle ? `${pageTitle} · 42LMS` : "42LMS";
};
