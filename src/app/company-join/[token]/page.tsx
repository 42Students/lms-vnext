import Link from "next/link";
import { publicCollegeJoinTokenSchema } from "@/modules/placements/public-college-join-model";

/** No public invitation lookup or account creation until scoped persistence is registered. */
export default async function CompanyJoinPage({ params }: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = publicCollegeJoinTokenSchema.safeParse(token).success;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <section className="min-w-0 rounded-xl border border-border bg-surface p-6">
        <p className="text-sm font-medium text-muted-foreground">42Students · Company invitation</p>
        <h1 className="mt-2 break-words text-2xl font-semibold text-foreground">
          {valid ? "Company invitation verification" : "Invitation unavailable"}
        </h1>
        <p role="status" className="mt-4 text-sm leading-6 text-body">
          {valid
            ? "Company-specific invitation verification is not available yet. No company or college access has been changed."
            : "The invitation link is invalid or unavailable. Request another from the placement cell."}
        </p>
        <Link href="/" className="mt-5 inline-block text-sm text-primary-text underline">Return home</Link>
      </section>
    </main>
  );
}
