/** Tukar Ringgit Malaysia ke sen (integer) — elak perpuluhan terapung */

export function rmStringToSen(input: string): number {
  const n = Number.parseFloat(input.replace(",", ".").trim());
  if (Number.isNaN(n)) throw new Error("Format yuran tidak sah");
  return Math.round(n * 100);
}

export function senToRmLabel(sen: number): string {
  return (sen / 100).toFixed(2);
}
