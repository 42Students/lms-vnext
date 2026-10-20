import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function StudentsDirectoryLoading(){return <div className="min-w-0 space-y-6"><PageHeader title="Students" /><GracefulPageLoading label="Loading College Students directory" shape="directory" /></div>;}
