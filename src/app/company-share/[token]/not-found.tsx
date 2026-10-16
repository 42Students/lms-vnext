import Link from "next/link";

export default function CompanyShareNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">
          This link is not valid any more.
        </h1>
        <p className="text-sm text-body">
          It may have expired or been withdrawn. Please ask the placement cell for a new one.
        </p>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
          Home
        </Link>
      </section>
    </main>
  );
}
