import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(p,"utf8");

test("UX-G050 enterprises has truthful capability discovery, real demo link and public states",()=>{
 const p=read("src/app/enterprises/page.tsx");
 const loading=read("src/app/enterprises/loading.tsx");
 const error=read("src/app/enterprises/error.tsx");
 assert.match(p, /<nav aria-label="Explore enterprise solutions"/);
 for(const target of ['href="#enterprise-workflows"','id="enterprise-workflows"',
  'href="#enterprise-capabilities"','id="enterprise-capabilities"',
  'href="/request-demo"','MarketingFeatureGrid','MarketingCta',
  'alternates:{canonical:CANONICAL}', 'These are potential organizational outcomes, not measured guarantees.']) {
  assert.ok(p.includes(target),target);
 }
 assert.match(p,/min-h-11 w-full sm:w-auto/);
 assert.match(loading,/Loading enterprise solutions/);
 assert.match(loading,/GracefulPageLoading/);
 assert.match(error,/homeHref="\/home"/);
 assert.doesNotMatch(p,/guaranteed hiring|autonomous agents/i);
});
test("UX-G052 homepage supplies accessible audience wayfinding and public recovery",()=>{
 const p=read("src/app/home/page.tsx");
 const loading=read("src/app/home/loading.tsx");
 const error=read("src/app/home/error.tsx");
 assert.match(p,/<nav aria-label="Explore 42 LMS by audience"/);
 for(const target of ['href="/universities"','href="/enterprises"','href="#home-journey"',
  'id="home-journey"','MarketingHero','MarketingCta','MarketingFeatureGrid',
  'min-h-11 w-full'])assert.ok(p.includes(target),target);
 assert.match(p,/marketingPageMetadata\("\/", title, description\)/);
 assert.match(error,/homeHref="\/"/);
 assert.match(loading,/Loading the 42 LMS homepage/);
});
test("UX-G077 platform links workspaces to a responsive lifecycle and safe public recovery",()=>{
 const p=read("src/app/platform/page.tsx");
 const loading=read("src/app/platform/loading.tsx");
 const error=read("src/app/platform/error.tsx");
 assert.match(p,/marketingPageMetadata\("\/platform"/);
 assert.match(p,/<nav aria-label="Explore platform workflows"/);
 for(const target of ['href="#platform-workspaces"','id="platform-workspaces"',
  'href="#platform-lifecycle"','id="platform-lifecycle"','href="/request-demo"',
  'sm:grid-cols-2 lg:grid-cols-3','WORKSPACES','PILLARS','LIFECYCLE'])
  assert.ok(p.includes(target),target);
 assert.doesNotMatch(p,/<svg aria-hidden="true" width="18" height="18"/);
 assert.match(loading,/Loading platform overview/);
 assert.match(error,/homeHref="\/home"/);
 assert.doesNotMatch(p,/autonomous AI platform for talent/i);
});
