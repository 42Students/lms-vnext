import {Skeleton} from "@/components/ui/skeleton";
export default function CollegeQuizzesLoading() {
  return <div className="min-w-0 space-y-4">
    <Skeleton variant="line" label="Loading college quizzes" />
    <Skeleton variant="form" label="Loading college quizzes" />
    <Skeleton variant="row" count={3} label="Loading college quizzes" />
  </div>;
}
