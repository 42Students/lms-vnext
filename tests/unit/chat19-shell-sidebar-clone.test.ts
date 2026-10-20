import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const shell = () => read("src/components/shell/app-shell.tsx");
const css = () => read("src/components/shell/sidebar-legacy.css");
const model = () => read("src/components/shell/shell-model.ts");

/** Source checks only; the owner runs browser/CI checks later. */
describe("chat-19 legacy sidebar structural guardrails", () => {
  it("uses a relative, non-shrinking desktop rail that pushes its flex sibling", () => {
    expect(shell()).toContain("lms-shell-frame");
    expect(shell()).toContain("lms-desktop-sidebar relative");
    expect(shell()).not.toContain("lms-desktop-sidebar fixed");
    expect(css()).toContain(".lms-shell-frame {display:flex;align-items:stretch;}");
    expect(css()).toContain(".lms-shell-page {min-width:0;flex:1 1 0%;}");
    expect(css()).not.toContain("padding-left:256px");
  });

  it("points brand and sidebar recovery to the first permitted account destination", () => {
    expect(shell()).toContain('const homeHref=navigation[0]?.href??"/dashboard"');
    expect(shell()).toContain('<Link href={homeHref} aria-label="42Students LMS home"');
    expect(shell()).toContain('fallbackHref={homeHref}');
    expect(shell()).not.toContain('<Link href="/dashboard" aria-label="42Students LMS home"');
  });

  it("retains the exact legacy collapsed and hover widths and easing", () => {
    expect(css()).toContain("width:96px");
    expect(css()).toContain("min-width:96px");
    expect(css()).toContain("width:256px");
    expect(css()).toContain("transition:width .15s cubic-bezier(.2,0,0,1)");
    expect(css()).toContain("box-shadow:inset 3px 0 #26bac7");
  });

  it("uses legacy learner rail inset and admin row padding only for the matching visible role", () => {
    const nav = read("src/components/shell/sidebar-nav.tsx");
    const old = read("docs/design/old-lms-shell.css");
    const learner = read("docs/design/legacy-styles/components___learn-layout.scss");
    expect(old).toContain("padding-top: 12px; padding-bottom: 12px");
    expect(learner).toContain("padding-right: $learn-s2;");
    expect(nav).toContain("data-sidebar-skin={sidebarSkin}");
    expect(nav).toContain('visibleItems.some(item=>item.href.startsWith("/admin/"))?"admin":');
    expect(nav).toContain('visibleItems.some(item=>item.href.startsWith("/learn/"))?"learner":"other"');
    expect(css()).toContain('.lms-desktop-sidebar:has(.lms-sidebar-nav[data-sidebar-skin="learner"]) {padding-right:16px;}');
    expect(css()).toContain('.lms-desktop-sidebar .lms-sidebar-nav[data-sidebar-skin="admin"] .lms-sidebar-item');
    expect(css()).toContain("padding-top:12px;");
    expect(css()).toContain("padding-bottom:12px;");
  });

  it("keeps mobile drawer controls accessible and its scroll surface padded", () => {
    const mobile = read("src/components/shell/mobile-navigation.tsx");
    expect(mobile).toContain('import { Drawer } from "@/components/ui/drawer"');
    expect(mobile).toContain('import { usePathname } from "next/navigation"');
    expect(mobile).toContain("useEffect(() => { setOpen(false); }, [pathname]);");
    expect(mobile).toContain('import {Button} from "@/components/ui/button"');
    expect(mobile).toContain('side="left"');
    expect(mobile).toContain('headerLeading={<ShellLogoMark />}');
    expect(mobile).toContain('!px-3 !pt-2 !pb-[calc(24px+env(safe-area-inset-bottom,0px))]');
    expect(css()).toContain('.lms-mobile-sidebar[data-slot="drawer"]');
    expect(css()).toContain("width:82vw");
    expect(css()).toContain("max-width:300px");
    expect(css()).toContain('-webkit-overflow-scrolling:touch');
  });

  it("matches the original 82 percent mobile drawer shadow, dividers and readable long labels", () => {
    const legacy = read("docs/design/legacy-styles/components___antddesign.scss");
    expect(legacy).toContain("box-shadow: 4px 0 16px rgba(0, 0, 0, 0.12)");
    expect(legacy).toContain("word-break: break-word");
    expect(legacy).toContain("overflow-wrap: break-word");
    expect(legacy).toContain("margin: 6px 8px !important");
    expect(css()).toContain("box-shadow:4px 0 16px rgba(0,0,0,.12)");
    expect(css()).toContain(".lms-mobile-sidebar .lms-nav-label {");
    expect(css()).toContain("white-space:normal;");
    expect(css()).toContain("overflow-wrap:break-word;");
    expect(css()).toContain("word-break:break-word;");
    expect(css()).toContain("margin:6px 8px;");
    // Desktop's original ellipsis remains intact; mobile overrides it only
    // inside the Drawer, without changing any portal's navigation labels.
    expect(css()).toContain("text-overflow:ellipsis;");
  });

  it("maps every sidebar destination to a real glyph or existing image", () => {
    const source = model();
    const mapped = new Set(
      [...source.matchAll(/"([/][^"]+)":[ ]*"[a-z-]+"/g)].map(match => match[1]),
    );
    const destinations = [...source.matchAll(/href:[ ]*"([/][^"]+)"/g)].map(match => match[1]);
    expect(destinations.length).toBeGreaterThan(50);
    for (const destination of destinations) expect(mapped.has(destination), destination).toBe(true);
    const images = [...source.matchAll(/(?:icon|activeIcon):[ ]*"([/]assets[/]images[/][^"]+)"/g)]
      .map(match => match[1]);
    for (const image of images) expect(existsSync("public" + image), image).toBe(true);
    const icon = read("src/components/shell/shell-nav-icons.tsx");
    expect(icon).toContain('import {legacyAntPaths} from "./legacy-ant-paths"');
  });

  it("isolates the route animation to content below the topbar", () => {
    expect(shell()).toContain("<RouteTransition>{children}</RouteTransition>");
    expect(shell().indexOf("<RouteTransition>")).toBeGreaterThan(shell().indexOf("<LegacyTopbar"));
    expect(read("src/components/shell/route-transition.css")).toContain("250ms ease-out");
  });
});
