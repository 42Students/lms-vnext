import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function NotFound() {
 return <section className="min-w-0 space-y-4">
 <PageHeader title="Quiz report unavailable" />
 <p className="max-w-prose text-sm leading-6 text-body">This Quiz may have moved or is no longer available to your Section.</p>
 <ButtonLink variant="secondary" href="/teacher/allQuizzes" className="w-full sm:w-auto">Back to all quizzes</ButtonLink>
 </section>;
}
