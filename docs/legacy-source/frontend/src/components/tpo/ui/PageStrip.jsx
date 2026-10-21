import Link from "next/link";

/**
 * The one-line summary that replaces the old hero banners: a few numbers that matter, each a doorway to the
 * list behind it. Renders nothing if there is nothing to show.
 *
 * items: [{ key, label, value, href?, onClick?, tone?: "attention" | "good" }]
 */
export default function PageStrip({ items, ariaLabel = "Summary", className = "", hideIfAllZero = false }) {
  const shown = (items || []).filter((i) => i && i.value !== undefined && i.value !== null);
  if (shown.length === 0) return null;
  // A row of zeros says nothing; pages with nothing to count can ask for it to be left out.
  if (hideIfAllZero && shown.every((i) => Number(i.value) === 0)) return null;
  return (
    <ul className={`tpo-strip ${className}`.trim()} aria-label={ariaLabel} data-testid="tpo.strip">
      {shown.map((i) => {
        const body = (
          <>
            <strong className="tpo-strip__value">{i.value}</strong>
            <span className="tpo-strip__label">{i.label}</span>
          </>
        );
        const cls = `tpo-strip__item${i.tone ? ` tpo-strip__item--${i.tone}` : ""}`;
        return (
          <li key={i.key || i.label}>
            {i.href ? <Link href={i.href} className={cls}>{body}</Link>
              : i.onClick ? <button type="button" className={cls} onClick={i.onClick}>{body}</button>
                : <span className={cls}>{body}</span>}
          </li>
        );
      })}
    </ul>
  );
}
