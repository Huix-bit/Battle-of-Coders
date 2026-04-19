/** Daerah & istilah tempatan untuk UI PASAR-SMART */

export const DAERAH_KEYS = [
  "BUKIT_BERUANG",
  "AYER_KEROH",
  "ALOR_GAJAH",
  "JASIN",
  "MELAKA_TENGAH",
] as const;

export type DaerahKey = (typeof DAERAH_KEYS)[number];

export const DAERAH_LABEL: Record<DaerahKey, string> = {
  BUKIT_BERUANG: "Bukit Beruang",
  AYER_KEROH: "Ayer Keroh",
  ALOR_GAJAH: "Alor Gajah",
  JASIN: "Jasin",
  MELAKA_TENGAH: "Melaka Tengah",
};

export function labelDaerah(key: string): string {
  if (key in DAERAH_LABEL) return DAERAH_LABEL[key as DaerahKey];
  return key;
}
