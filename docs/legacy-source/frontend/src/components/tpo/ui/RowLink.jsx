import Link from "next/link";

/**
 * A list/table row that goes somewhere, as a real link: keyboard-focusable, middle-click opens a new tab,
 * screen readers announce it. Replaces `<div onClick={() => router.push(...)}>`.
 */
export default function RowLink({ href, children, className = "", ...rest }) {
  return <Link href={href} className={`tpo-row-link ${className}`.trim()} {...rest}>{children}</Link>;
}
