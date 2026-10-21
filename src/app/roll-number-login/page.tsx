import { LearnerRollNumberLogin } from "@/components/auth/learner-roll-number-login";

export default function RollNumberLoginPage() {
  return <main className="mx-auto max-w-3xl px-4 py-10">
    <h1 className="mb-5 text-center text-2xl font-semibold">Student login</h1>
    <LearnerRollNumberLogin />
  </main>;
}
