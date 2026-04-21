"use client";

interface AnalyticsSummaryProps {
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
}

function formatRinggit(value: number) {
  return `RM ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  const totalTransactions = summary.totalTransactions;
  const totalRevenue = summary.totalRevenue;
  const avgOrderValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const cards = [
    {
      label: "Total Transactions",
      value: totalTransactions.toLocaleString(),
      trend: "Live 24h total",
      icon: "💳",
      accent: "text-violet-400",
    },
    {
      label: "Est. Revenue",
      value: formatRinggit(totalRevenue),
      trend: "Live market revenue",
      icon: "💰",
      accent: "text-[var(--accent)]",
    },
    {
      label: "Avg. Order Value",
      value: totalTransactions > 0 ? formatRinggit(avgOrderValue) : "RM 0.00",
      trend: "Revenue / transactions",
      icon: "📊",
      accent: "text-[var(--accent)]",
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-4"
        >
          <span className="text-xl">{card.icon}</span>
          <p className={`mt-1 text-xl font-bold ${card.accent}`}>{card.value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {card.label}
          </p>
          <p className="text-[10px] text-emerald-400">{card.trend}</p>
        </div>
      ))}
    </>
  );
}
