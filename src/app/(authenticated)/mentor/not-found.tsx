import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

/** In the authenticated shell, errors use its single white page canvas.
 * Do not redirect all unknown mentor paths: only the legacy bookmarked dynamic
 * /mentor/courses/[courseId] route redirects silently to /mentor/projects.
 * A future dynamic page.tsx owns that redirect; all other 404s remain real.
 */
export default function NotFound() {
  return <section className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <ButtonLink variant="secondary" href="/mentor" className="w-full sm:w-auto">Go to home</ButtonLink>
  </section>;
}
