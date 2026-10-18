"use client";

import Link from "next/link";
import styles from "./public-screen.module.css";

export function ErrorRecoveryActions({ retry }: { retry?: () => void }) {
  return (
    <div className={styles.actions}>
      {retry ? <button type="button" onClick={retry} className={styles.primary}>Try again</button> : null}
      <button type="button" onClick={() => window.history.back()} className={styles.secondary}>Go back</button>
      <Link href="/" className={styles.secondary}>Go to Home</Link>
    </div>
  );
}
