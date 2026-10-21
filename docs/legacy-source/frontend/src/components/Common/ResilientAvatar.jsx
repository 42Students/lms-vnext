import { useEffect, useMemo, useState } from "react";

const cleanSource = (src) => {
  if (typeof src !== "string") return null;
  const value = src.trim();
  if (!value || value.toLowerCase() === "string") return null;
  return value;
};

const initialsFor = (name) => {
  // Only words that start with a letter or digit: "NSRIT TPO (Test)" is "NT", not "N(".
  const parts = String(name || "").trim().split(/\s+/).filter((part) => /^[\p{L}\p{N}]/u.test(part));
  if (!parts.length) return "?";
  return [parts[0], parts.length > 1 ? parts[parts.length - 1] : null]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

/**
 * Small shared image/avatar primitive with geometry reservation and a deterministic fallback.
 * The container owns width/height before the image loads, so slow/broken remote images cannot
 * collapse or shift surrounding layout.
 */
export default function ResilientAvatar({
  src,
  name,
  alt,
  size = 48,
  shape = "circle",
  fit = "cover",
  className = "",
  priority = false,
}) {
  const [broken, setBroken] = useState(false);
  const safeSrc = useMemo(() => cleanSource(src), [src]);
  const initials = useMemo(() => initialsFor(name), [name]);

  useEffect(() => {
    setBroken(false);
  }, [safeSrc]);

  const radius = shape === "square" ? 8 : "50%";
  const label = alt || (name ? `${name} avatar` : "Avatar");

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: radius,
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "#f0f2f5",
        color: "#5b6472",
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {safeSrc && !broken ? (
        <img
          src={safeSrc}
          alt={label}
          width={size}
          height={size}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }}
        />
      ) : (
        <span role="img" aria-label={label} style={{ fontSize: Math.max(12, Math.round(size * 0.34)) }}>
          {initials}
        </span>
      )}
    </span>
  );
}
