import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";

export default function LoadingInboundMail(){
 return <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading inbound mail table">
  <PageHeader title="Inbound mail"/>
  <p role="status" className="text-sm text-body">Loading inbound mail…</p>
  <div className="border-y border-border py-3">
   <Skeleton variant="row" count={6} label="Loading inbound mail rows"/>
  </div>
 </section>;
}
