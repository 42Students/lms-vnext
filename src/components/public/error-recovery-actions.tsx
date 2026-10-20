"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import styles from "./public-screen.module.css";

export function ErrorRecoveryActions({ retry }: { retry?: () => void }) {
  return (
    <div className={styles.actions}>
      {retry ? <Button type="button" onClick={retry} className={styles.primary}>Try again</Button> : null}
      <Button variant="secondary" type="button" onClick={() => window.history.back()} className={styles.secondary}>Go back</Button>
      <Link href="/" className={styles.secondary}>Go to Home</Link>
    </div>
  );
}
