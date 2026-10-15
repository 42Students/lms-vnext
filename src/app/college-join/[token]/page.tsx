import Link from "next/link";
import { publicCollegeJoinTokenSchema } from "@/modules/placements/public-college-join-model";

/** Unauthenticated-safe shell. A raw link alone must never confer membership. */
export default async function CollegeJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = publicCollegeJoinTokenSchema.safeParse(token).success;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <section className="min-w-0 rounded-xl border border-border bg-surface p-6">
        <p className="text-sm font-medium text-muted-foreground">42Students · Recruiter access</p>
        <h1 className="mt-2 break-words text-2xl font-semibold text-foreground">
          {valid ? "College invitation" : "Invitation unavailable"}
        </h1>
        <p role="status" className="mt-4 text-sm leading-6 text-body">
          {valid
            ? "This invitation cannot yet be verified. No access has been granted. Work-email verification will become available after the college invitation service is enabled."
            : "This invitation cannot be used. Ask the placement cell for a current link."}
        </p>
        <Link href="/" className="mt-5 inline-block text-sm text-primary-text underline">
          Return to home
        </Link>
      </section>
    </main>
  );
}
