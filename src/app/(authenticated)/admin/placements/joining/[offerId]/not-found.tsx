import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function NotFound() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Joining detail"/>
  <EmptyState title="Joining outcome not found" description="The selected-college joining record is unavailable in this scope."
    action={<TextLink href="/admin/placements/joining" className="inline-flex min-h-11 items-center md:min-h-9">Joining outcomes</TextLink>} />
 </div>;
}
