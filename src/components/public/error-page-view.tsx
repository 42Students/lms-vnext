import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorRecoveryActions } from "./error-recovery-actions";
import styles from "./public-screen.module.css";

export function ErrorPageView({ code, title, message, retry }: {
  code: "404" | "500";
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="42LMS home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={styles.legacyLogo} />
        </Link>
      </header>
      <div className={styles.center}>
        <section className={styles.card} aria-labelledby="error-page-title">
          <div className={styles.icon} aria-hidden="true">{code}</div>
          <PageHeader id="error-page-title" title={title} />
          <p className={styles.message}>{message}</p>
          <ErrorRecoveryActions retry={retry} />
        </section>
      </div>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} 42LMS · JRSPF Technologies Pvt. Ltd.</span>
        <nav className={styles.footerLinks} aria-label="Footer">
          <Link href="/privacy-policy">Privacy</Link>
          <a href="/assets/static/terms-and-conditions-view.html">Terms</a>
        </nav>
      </footer>
    </main>
  );
}
