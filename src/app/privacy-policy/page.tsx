import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Privacy Policy | 42LMS",
  description: "How 42LMS collects, uses, shares and protects your information.",
  alternates: { canonical: "https://42lms.com/privacy-policy" },
  robots: { index: true, follow: true },
};

/** Serve the checked-in Android/web policy at its stable, indexed URL.
 * Rendering the trusted, versioned static body keeps all legacy #section
 * anchors without redirecting mobile/web visitors to an asset path. */
export default async function PrivacyPolicyPage() {
  const html = await readFile(join(process.cwd(),
    "public/assets/static/privacy-policy-view.html"), "utf8");
  const documentBody = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1];
  const css = /<style[^>]*>([\s\S]*?)<\/style>/i.exec(html)?.[1];
  if (!documentBody || !css) throw new Error("Bundled 42LMS privacy policy is incomplete");
  // This is repository-authored legal HTML, not user input. Serve both the
  // preserved 13 section anchors and original scoped CSS on the canonical URL.
  // Static HTML's <main> is already in documentBody: do not nest <main>s.
  // Scope presentation-only improvements to the bundled policy. Never edit
  // legal statements or replace section IDs that Android/web links rely on.
  const accessibleCss = `
    .privacy-page .quick-links > a {
      display:flex; align-items:center; min-height:44px; min-width:0;
      padding:8px 12px; border-radius:6px; overflow-wrap:anywhere;
    }
    .privacy-page .quick-links > a:focus-visible,
    .privacy-page .brand-link:focus-visible {
      outline:3px solid #ffffff; outline-offset:3px;
      text-decoration:underline;
    }
    .privacy-page .quick-links > a:focus-visible {
      outline-color:#266891;
    }
    .privacy-page section[id] {scroll-margin-top:24px;}
    @media (max-width:640px) {
      .privacy-page .quick-links {grid-template-columns:1fr;}
      .privacy-page .privacy-content {padding-bottom:32px;}
    }
    @media print {
      .privacy-page .quick-links {display:none;}
      .privacy-page {background:#fff;}
      .privacy-page .privacy-hero {print-color-adjust:exact;}
      .privacy-page section[id] {break-inside:avoid;}
    }
  `;
  return <>
    <link rel="stylesheet" href="/assets/static/static-page.css" />
    <style dangerouslySetInnerHTML={{__html:css + accessibleCss}} />
    <a href="#overview" className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:text-foreground focus:outline-2 focus:outline-offset-2">
      Skip to policy content
    </a>
    <div aria-label="42LMS Privacy Policy"
      dangerouslySetInnerHTML={{__html:documentBody}} />
  </>;
}
