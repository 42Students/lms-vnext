import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
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
  if (!documentBody) throw new Error("Bundled 42LMS privacy policy is incomplete");
  return <>
    <link rel="stylesheet" href="/assets/static/static-page.css" />
    <main aria-label="42LMS Privacy Policy"
      dangerouslySetInnerHTML={{ __html: documentBody }} />
  </>;
}
