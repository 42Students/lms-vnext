/** WCAG 2.2 contrast; canonical LMS colors must retain their brand values. */
export function luminance(hex: string): number {
  const normalized = hex.replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) throw new Error("Expected an RGB hex color");
  const linear = [0, 2, 4].map(index => {
    const value = parseInt(normalized.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (linear[0] ?? 0) * 0.2126 + (linear[1] ?? 0) * 0.7152 + (linear[2] ?? 0) * 0.0722;
}
export function contrastRatio(a: string,b: string): number {
  const l1=luminance(a), l2=luminance(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
export const LMS_AA = {
  teal:"#26bac7", ink:"#1a1d21", white:"#ffffff",
  link:"#0e7c87", hover:"#1e9aa8", errorSubtle:"#fff0f0",
} as const;
