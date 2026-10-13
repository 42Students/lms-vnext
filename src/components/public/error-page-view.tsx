import { ErrorRecoveryActions } from "./error-recovery-actions";

export function ErrorPageView({
  code,
  title,
  message,
  retry,
}: {
  code: "404" | "500";
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--lms-neutral-50)] px-6 py-12 text-center">
      <div className="w-full max-w-lg">
        <p className="m-0 text-7xl font-extrabold leading-none text-primary-text" aria-hidden="true">
          {code}
        </p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mx-auto mb-8 mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {message}
        </p>
        <ErrorRecoveryActions retry={retry} />
      </div>
    </main>
  );
}
