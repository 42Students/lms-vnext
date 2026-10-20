import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function CollegeVideosLoading(){
 return <div className="min-w-0 space-y-6"><PageHeader title="Video" /><GracefulPageLoading label="Loading videos" shape="directory" /></div>;
}
