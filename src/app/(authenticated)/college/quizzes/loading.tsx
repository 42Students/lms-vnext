import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function CollegeQuizzesLoading() {return <div className="min-w-0 space-y-6"><PageHeader title="Quizzes" /><GracefulPageLoading label="Loading college quizzes" shape="directory" /></div>;}
