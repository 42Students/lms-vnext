import { notFound } from "next/navigation";
import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
import { Heading } from "@/components/ui/heading";

export const dynamic = "force-dynamic";
/** Development-only UI fixture; any save request must be mocked by tests. */
export default function CollegeContactProfileFixture() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main className="mx-auto min-w-0 max-w-4xl px-4 py-8">
    <Heading level={1} className="mb-6 text-2xl font-semibold">College contact settings</Heading>
    <CollegeContactProfileForm initial={{
      collegeName: "Example College",
      supportEmail: "help@example.edu",
      supportPhone: "+91 98765 43210",
      termsUrl: "https://example.edu/terms",
      privacyUrl: "https://example.edu/privacy",
      version: 7,
    }}/>
  </main>;
}
