/** Bandingan tarikh mengikut hari (zon masa tempatan pelayan) */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isBeforeToday(d: Date): boolean {
  return startOfDay(d).getTime() < startOfDay(new Date()).getTime();
}

export function isValidDateRange(mula: Date, tamat: Date | null): boolean {
  if (!tamat) return true;
  return startOfDay(tamat).getTime() >= startOfDay(mula).getTime();
}

/** Nilai untuk input `datetime-local` */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
