import {PageHeader} from "@/components/ui/page-header";
export default function MentorOpening(){
 return <div role="status" aria-live="polite" aria-busy="true" className="mx-auto flex min-h-[50vh] max-w-[720px] flex-col items-center justify-center gap-4 px-5 text-center">
  <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle text-3xl text-primary-text">i</div>
  <PageHeader title="Opening your mentor workspace"/>
 </div>;
}
