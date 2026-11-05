import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function NotFound() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Offer detail"/>
  <EmptyState title="Offer not found" description="The selected-college offer record is unavailable in this scope."
    action={<TextLink href="/admin/placements/offers" className="inline-flex min-h-11 items-center md:min-h-9">Offers</TextLink>}/>
 </div>;
}
