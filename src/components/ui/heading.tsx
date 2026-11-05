import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/lib/class-names";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "inherit" | "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

export type HeadingProps = ComponentPropsWithoutRef<"h1"> & {
  /** Document outline level; level 1 is the page title. */
  level?: HeadingLevel;
  /** Visual size from the type scale. "inherit" keeps the parent's size. */
  size?: HeadingSize;
};

const sizeClasses: Record<HeadingSize, string> = {
  inherit: "",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

/** Section/card headings: one weight, sizes from the type scale only. */
export function Heading({ level = 2, size = "inherit", className, children, ...props }: HeadingProps) {
  const Tag = `h${level}` as "h1";
  return <Tag data-slot="heading" {...props} className={cx("font-semibold", sizeClasses[size], className)}>{children}</Tag>;
}
