import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
export default function TpoProfileLoading(){
 return <div className="min-w-0 space-y-3">
  <p role="status" className="text-sm text-muted-foreground">Refreshing profile…</p>
  <GracefulPageLoading label="Loading or refreshing your TPO profile…"/>
 </div>;
}
