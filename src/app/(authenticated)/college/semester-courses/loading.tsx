import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function SemesterCoursesLoading(){return <div className="min-w-0 space-y-6"><PageHeader title="Semester–Course Mapping" /><GracefulPageLoading label="Loading course mappings" shape="directory" /></div>;}
