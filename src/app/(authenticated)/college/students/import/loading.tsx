import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function StudentImportLoading(){return <div className="min-w-0 space-y-6"><PageHeader title="Import students" /><GracefulPageLoading label="Loading student importer" shape="directory" /></div>;}
