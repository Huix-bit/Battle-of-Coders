"use client";

import Link from "next/link";
import { useMemo } from "react";

const MARKET_SCHEDULE = [
  {
    id: "melaka",
    date: "April 20, 2026",
    marketName: "Pasar Malam Melaka",
    location: "Jalan Banda, 75200 Melaka",
    operatingHours: "6:00 PM - 11:30 PM",
    status: "Active",
  },
  {
    id: "bukit",
    date: "April 22, 2026",
    marketName: "Bukit Baru Night Market",
    location: "Market Square, Bukit Baru, 75200 Melaka",
    operatingHours: "6:30 PM - 11:00 PM",
    status: "Upcoming",
  },
  {
    id: "jonker",
    date: "April 24, 2026",
    marketName: "Jonker Walk Night Market",
    location: "Jalan Jonker, 75200 Melaka",
    operatingHours: "5:00 PM - 11:00 PM",
    status: "Upcoming",
  },
  {
    id: "klebang",
    date: "April 26, 2026",
    marketName: "Klebang Beach Night Market",
    location: "Pantai Klebang, 75200 Melaka",
    operatingHours: "6:00 PM - 11:00 PM",
    status: "Upcoming",
  },
  {
    id: "canceled",
    date: "April 18, 2026",
    marketName: "Batu Berendam Market",
    location: "Batu Berendam, 75350 Melaka",
    operatingHours: "5:00 PM - 10:30 PM",
    status: "Canceled",
  }
];

function getGoogleCalendarUrl({ title, description, location, startDate, endDate }: { title: string, description: string, location: string, startDate: Date | string, endDate: Date | string }) {
  const formatGoogleDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
}

export default function CalendarPage() {
  const sortedSchedule = useMemo(() => {
    return [...MARKET_SCHEDULE].sort((a, b) => {
      const dayA = parseInt(a.date.replace(/[^0-9]/g, ''), 10);
      const dayB = parseInt(b.date.replace(/[^0-9]/g, ''), 10);
      return dayA - dayB;
    });
  }, []);

  const handleRemindMe = (market: typeof MARKET_SCHEDULE[0]) => {
    if (market.status === "Canceled") return;
    const [startStr, endStr] = market.operatingHours.split(' - ');
    const startDate = new Date(`${market.date} ${startStr}`);
    const endDate = new Date(`${market.date} ${endStr}`);
    if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
    const url = getGoogleCalendarUrl({
      title: market.marketName,
      description: `Don't miss the ${market.marketName} night market! Operating hours: ${market.operatingHours}.`,
      location: market.location,
      startDate,
      endDate
    });
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link href="/user" className="hover:text-[var(--text)] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[var(--text)]">Calendar</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            📅 Live Market Calendar
          </h1>
          <p className="text-base text-[var(--muted)]">
            Plan your visits and support local vendors across active trading hubs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {sortedSchedule.map((market) => {
            const isActive = market.status === "Active";
            const isUpcoming = market.status === "Upcoming";
            const isCanceled = market.status === "Canceled";

            return (
              <div
                key={market.id}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--lifted)] transition-all hover:border-emerald-500/30 hover:bg-[var(--raised)] group"
              >
                {isActive && (
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_#10b98122_0%,_transparent_50%)]" />
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      {market.date}
                    </span>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      isUpcoming ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                      "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {isActive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
                      {isUpcoming && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                      {isCanceled && <span className="h-1.5 w-1.5 rounded-full bg-red-400" />}
                      {market.status}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-[var(--accent-strong)] mb-1">{market.marketName}</h2>

                  <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">🕐</span>
                      <span>{market.operatingHours}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">📍</span>
                      <span>{market.location}</span>
                    </div>
                  </div>

                  <div className="flex-1" />

                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex flex-col gap-3">
                    {!isCanceled && (
                      <button
                        type="button"
                        onClick={() => handleRemindMe(market)}
                        className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all border border-[var(--border)] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                      >
                        📅 Remind Me
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
