"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function AdminPromotionError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load promotion preview" description="The scoped batch preview is unavailable. No academic records were modified." action={<div className="flex flex-wrap items-center gap-3"><Button type="button" onClick={reset} className="w-full md:w-auto">Retry preview</Button><TextLink href="/admin/academics" className="inline-flex min-h-11 items-center md:min-h-9">Back to Academic Setup</TextLink></div>} />;
}
