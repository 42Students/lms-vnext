import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ recruiter?: string | string[] }>;
}) {
  const { recruiter } = await searchParams;
  const selected = Array.isArray(recruiter) ? recruiter[0] : recruiter;
  // Old recruiter invitation links intentionally open the email-first form.
  redirect(selected === "email" ? "/?recruiter=email" : "/");
}
