// Lightweight inline line-icons for the marketing site (no icon library / no antd).
// Stroke uses currentColor so callers control color via CSS.

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const paths = {
  tutor: <path d="M22 10 12 5 2 10l10 5 10-5Zm-4 2.2V17c0 1.1-2.7 2.5-6 2.5S6 18.1 6 17v-4.8" />,
  assessment: (
    <>
      <path d="M9 3h6a2 2 0 0 1 2 2v0H7v0a2 2 0 0 1 2-2Z" />
      <path d="M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  coach: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-4 .5 2-5 4-.5Z" />
    </>
  ),
  career: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  knowledge: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h7v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2V5Z" />
    </>
  ),
  workforce: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9" />
    </>
  ),
  mentor: (
    <>
      <rect x="6" y="4" width="12" height="14" rx="3" />
      <path d="M9 18v2M15 18v2M9.5 10h.01M14.5 10h.01M9.5 13.5h5" />
      <path d="M12 2v2" />
    </>
  ),
  skills: (
    <>
      <path d="M12 3 3 8v8l9 5 9-5V8l-9-5Z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 3 3 4-6" />
    </>
  ),
  spark: <path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 5 5L20 6" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  play: <path d="M8 5v14l11-7L8 5Z" />,
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

export default function Icon({ name, size = 24, className, ...rest }) {
  const body = paths[name] || paths.spark;
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true" {...rest}>
      {body}
    </svg>
  );
}
