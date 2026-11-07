import { notFound } from "next/navigation";
import { SuperAdminContentDirectoryPage } from "@/components/courses/super-admin-content-directory-page";
import FacultyQuizAttemptPage from "@/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page";
import SuperAdminNotFound from "@/app/(authenticated)/superadmin/not-found";
import { UXFiveRouteErrorPreview } from "@/components/ux/ux-five-route-error-preview";

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
    <h1 className="text-xl font-semibold">Five-group route recovery acceptance</h1>
    <UXFiveRouteErrorPreview />
    <section aria-label="Super Admin missing legacy page" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Missing Super Admin bookmark</h2>
      <SuperAdminNotFound />
    </section>
    <section aria-label="Super Admin content invalid filter" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Content filter recovery</h2>
      <SuperAdminContentDirectoryPage kind="VIDEOS"
        searchParams={Promise.resolve({ unsupported: "forged" })} />
    </section>
    <section aria-label="Faculty attempt invalid filter" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Faculty attempt recovery</h2>
      <FacultyQuizAttemptPage
        params={Promise.resolve({quizId:"10000000-0000-4000-8000-000000000001"})}
        searchParams={Promise.resolve({deliveryId:"not-a-uuid"})} />
    </section>
  </main>;
}
