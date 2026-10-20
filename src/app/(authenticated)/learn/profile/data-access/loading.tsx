import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
export default function ProfileDataAccessLoading(){return <section className="min-w-0 space-y-4"><PageHeader title="Who has my data"/><LoadingState label="Loading your data-access summary…" /></section>;}
