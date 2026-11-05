import { LearnerRollNumberLogin } from "@/components/auth/learner-roll-number-login";
import { Heading } from "@/components/ui/heading";

export default function RollNumberLoginPage() {
  return <main className="mx-auto max-w-3xl px-4 py-10">
    <Heading level={1} size="2xl" className="mb-5 text-center">Student login</Heading>
    <LearnerRollNumberLogin />
  </main>;
}
