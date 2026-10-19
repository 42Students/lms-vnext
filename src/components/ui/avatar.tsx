"use client";

import { useState } from "react";
import { cx } from "@/lib/class-names";

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};
export function avatarInitials(name: string) {
  return name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase("en-IN") ?? "").join("") || "?";
}
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedUrl);
  const classes = cx("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--lms-canvas-border)] bg-[var(--lms-avatar-placeholder)] font-semibold text-[var(--lms-heading)] ring-0", size === "sm" ? "h-8 w-8 text-[12px]" : size === "lg" ? "h-[52px] w-[52px] p-[3px] text-[13px]" : "h-11 w-11 text-[13px]", className);
  return <span data-slot="avatar" className={classes} aria-label={name}>
    {showImage ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src ?? undefined} onError={() => setFailedUrl(src ?? null)} alt="" loading="lazy" referrerPolicy="no-referrer" width={size === "sm" ? 32 : size === "lg" ? 45 : 44} height={size === "sm" ? 32 : size === "lg" ? 45 : 44} className="block h-full w-full object-cover object-center" />
    ) : <span aria-hidden="true">{avatarInitials(name)}</span>}
  </span>;
}
