import React, { useEffect, useState } from "react";

const AVATAR_COLORS = [
  { bg: "#e8f4fd", text: "#0c63d4" },
  { bg: "#e8f5e9", text: "#2e7d32" },
  { bg: "#f3e5f5", text: "#7b1fa2" },
  { bg: "#fff3e0", text: "#e65100" },
  { bg: "#e0f2f1", text: "#00695c" },
  { bg: "#fce4ec", text: "#c2185b" },
  { bg: "#e8eaf6", text: "#3949ab" },
  { bg: "#f1f8e9", text: "#558b2f" },
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PlacementsCompanyAvatar({ companyName, companyLogo, size = 48, className = "learn-placements" }) {
  const [imgError, setImgError] = useState(false);
  const name = companyName || "?";

  // Reset the broken-image fallback whenever the logo prop changes, so fixing a broken URL
  // and re-rendering with a new value clears the stuck fallback without a full page reload.
  useEffect(() => {
    setImgError(false);
  }, [companyLogo]);

  if (companyLogo && String(companyLogo).startsWith("https://") && !imgError) {
    return (
      // Logos sit inside a neutral tile and are contained (never cropped) — see
      // `.learn-jobs-avatar img { object-fit: contain }`. `--logo` marks the image variant so
      // stylesheets can pad the tile without affecting the initial-letter variant.
      <div className={`${className}-avatar ${className}-avatar--logo`} style={{ width: size, height: size }}>
        <img src={companyLogo} alt={name} onError={() => setImgError(true)} loading="lazy" />
      </div>
    );
  }

  const initial = name.charAt(0).toUpperCase();
  const { bg, text } = getAvatarColor(name);
  return (
    <div
      className={`${className}-avatar ${className}-avatar--initial`}
      style={{ width: size, height: size, background: bg, color: text, fontSize: size <= 36 ? 15 : 18 }}
    >
      {initial}
    </div>
  );
}
