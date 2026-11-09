"use client";
import { useParams } from "next/navigation";
import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({ error, reset }: {
 error: Error & { digest?: string }; reset: () => void;
}) {
 const params = useParams<{ batchId?: string }>();
 const batchId = params?.batchId;
 const batchHref = batchId && /^[0-9a-f-]{36}$/i.test(batchId)
  ? `/tpo/batches/${encodeURIComponent(batchId)}`
  : "/tpo/batches";
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Batch classes" />
  <GracefulErrorBoundary error={error} reset={reset} insideShell showHeader={false} homeHref={batchHref} />
 </div>;
}
