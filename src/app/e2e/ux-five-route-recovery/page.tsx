import { notFound } from "next/navigation";
import { SuperAdminContentDirectoryPage } from "@/components/courses/super-admin-content-directory-page";
import FacultyQuizAttemptPage from "@/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page";
import SuperAdminNotFound from "@/app/(authenticated)/superadmin/not-found";
import { UXFiveRouteErrorPreview } from "@/components/ux/ux-five-route-error-preview";
import { Heading } from "@/components/ui/heading";

export const dynamic = "force-dynamic";

/**
 * Strict development-only acceptance surface. No authentication shortcut, test
 * accounts, tenant-specific data, or service calls. Invalid-filter branches
 * exit before private data readers are reached.
 */
export default async function UXFiveRouteRecoveryFixture() {
  if (process.env.NODE_ENV !== "development" ||
      process.env["UX_FIVE_ROUTE_FIXTURE"] !== "1") notFound();

  return <main className="mx-auto w-full max-w-4xl min-w-0 space-y-8 px-4 py-8">
    <Heading level={1} className="text-xl font-semibold">Five-group route recovery acceptance</Heading>
    <UXFiveRouteErrorPreview />
    <section aria-label="Super Admin missing legacy page" className="min-w-0 space-y-2 border-b border-border pb-6">
      <Heading level={2} className="text-lg font-semibold">Missing Super Admin bookmark</Heading>
      <SuperAdminNotFound />
    </section>
    <section aria-label="Super Admin content invalid filter" className="min-w-0 space-y-2 border-b border-border pb-6">
      <Heading level={2} className="text-lg font-semibold">Content filter recovery</Heading>
      <SuperAdminContentDirectoryPage kind="VIDEOS"
        searchParams={Promise.resolve({ unsupported: "forged" })} />
    </section>
    <section aria-label="Faculty attempt invalid filter" className="min-w-0 space-y-2 border-b border-border pb-6">
      <Heading level={2} className="text-lg font-semibold">Faculty attempt recovery</Heading>
      <FacultyQuizAttemptPage
        params={Promise.resolve({quizId:"10000000-0000-4000-8000-000000000001"})}
        searchParams={Promise.resolve({deliveryId:"not-a-uuid"})} />
    </section>
  </main>;
}
