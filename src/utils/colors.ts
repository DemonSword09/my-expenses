// src/utils/colors.ts
export function formatColorValue(
  c: string | number | null | undefined,
  fallback = '#2563EB',
): string {
  if (!c && c !== 0) return fallback;
  if (typeof c === 'number') {
    const rgb = (c as number) & 0xffffff;
    return '#' + rgb.toString(16).padStart(6, '0');
  }
  const s = String(c).trim();
  if (s.startsWith('#')) {
    if (s.length === 7) return s;
    if (s.length === 4) return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const hex = s.replace('#', '').slice(-6);
    return '#' + hex.padStart(6, '0');
  }
  if (/^[0-9A-Fa-f]{6}$/.test(s)) return '#' + s;
  if (/^[0-9A-Fa-f]{3}$/.test(s)) return '#' + s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  return fallback;
}
