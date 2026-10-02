export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">42Students</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
          LMS vNext
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          Foundation initialized. The new LMS is being built as a GCP-native
          TypeScript modular monolith.
        </p>
        <div className="mt-8 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
          No legacy LMS feature has been migrated yet.
        </div>
      </section>
    </main>
  );
}
