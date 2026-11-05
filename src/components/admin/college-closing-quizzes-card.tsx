import {EmptyState} from "@/components/ui/empty-state";
import type {getCollegeClosingQuizzes} from "@/modules/admin-ui/college-dashboard-quizzes-service";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
type Data=Awaited<ReturnType<typeof getCollegeClosingQuizzes>>;
export function CollegeClosingQuizzesCard({data}:{data:Data}){
 const date=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
 return <section className="space-y-3 border-t border-border pt-5" aria-label="Quizzes closing this week">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><Heading level={2} className="text-foreground">Quizzes closing this week</Heading>
    <p className="text-sm text-body">{data.total.toLocaleString("en-IN")} published quiz(es) due in the next 7 days</p></div>
   <TextLink href="/college/quizzes" className="inline-flex min-h-11 items-center md:min-h-9">View quizzes</TextLink>
  </div>
  {!data.items.length?<EmptyState title="No quizzes closing this week" description="Published quizzes due in the next seven days will appear here."/>:
  <ul className="divide-y divide-border">
   {data.items.map(quiz=><li key={quiz.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
    <span><strong>{quiz.title}</strong><span className="ml-2 text-muted-foreground">{quiz.course}</span></span>
    <span>{quiz.dueAt?date.format(quiz.dueAt):"No deadline"}</span>
   </li>)}
  </ul>}
  {data.total>data.items.length?<p className="text-xs text-muted-foreground">Showing the next {data.items.length}; open Quizzes for more.</p>:null}
 </section>;
}
