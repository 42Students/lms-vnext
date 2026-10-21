import type { Metadata } from "next";
import { GracefulScreen } from "@/components/public/graceful-screen";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getShellNavigation } from "@/components/shell/shell-model";

export const metadata: Metadata = {
  title: "Page Not Found | 42LMS",
  robots: { index: false, follow: false },
};

/** The same boundary catches root and unknown nested authenticated paths.
 * A selected role resolves its own first usable sidebar destination, while
 * multi-role or not-yet-selected sessions use the workspace dashboard. */
export default async function NotFound() {
  let homeHref = "/dashboard";
  try {
    const context = await getCurrentRequestContext();
    const landing = getShellNavigation(context)[0]?.href;
    if (landing?.startsWith("/") && !landing.startsWith("//"))
      homeHref = landing;
  } catch {
    // No signed-in role exists: the centralized dashboard handles sign-in.
  }
  // GracefulScreen's legacy-404 presentation already renders the 4rem 404
  // numeral, the "Page Not Found" heading, and the two original actions.
  // The lowercase discriminator selects that layout; do not substitute
  // the error heading/copy into JSON API responses.
  return <GracefulScreen title="Page not found"
    message="The page you are looking for doesn't exist, moved, or is no longer available."
    homeHref={homeHref} homeLabel="Go to Home"/>;
}
