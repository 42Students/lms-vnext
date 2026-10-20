import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function CollegeResourcesLoading(){return <div className="min-w-0 space-y-6"><PageHeader title="Resources" /><GracefulPageLoading label="Loading resources" shape="directory" /></div>;}
