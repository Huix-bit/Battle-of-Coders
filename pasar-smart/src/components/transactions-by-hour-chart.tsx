"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HourlyData {
  hour: string;
  transactions: number;
  isPeakHour?: boolean;
}

interface TransactionsByHourChartProps {
  data: HourlyData[];
  peakHours: HourlyData[];
  selectedHour: number;
  onHourHover: (hour: number) => void;
  loading: boolean;
  lastRefresh: Date | null;
  isMounted: boolean;
}

const CHART_COLORS = {
  deepGold: "#FBC901",
  purpleLine: "#a855f7",
  purpleFill: "#9333ea",
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: HourlyData;
  }>;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: HourlyData;
}

interface MouseMoveState {
  activeTooltipIndex?: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-[#fbbf24]/40 bg-[#1f2937] p-3 shadow-xl"
      style={{
        backgroundColor: "rgba(2, 6, 23, 0.95)",
        borderColor: CHART_COLORS.deepGold,
      }}
    >
      <p className="text-xs font-semibold" style={{ color: CHART_COLORS.deepGold }}>
        {point.hour}
      </p>
      <p className="mt-1 text-sm font-bold" style={{ color: "#e0e7ff" }}>
        {point.transactions} transactions
      </p>
      {point.isPeakHour && (
        <p className="mt-1 text-xs font-semibold text-emerald-400">🔥 Peak Hour</p>
      )}
    </div>
  );
};

const CustomDot = ({ cx, cy, payload }: DotProps) => {
  if (!payload?.isPeakHour || cx === undefined || cy === undefined) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={CHART_COLORS.deepGold}
      stroke="#020617"
      strokeWidth={2}
    />
  );
};

const ChartSkeleton = () => (
  <div className="h-80 w-full animate-pulse rounded-lg bg-[#0f172a] p-4">
    <div className="mb-4 h-6 w-32 rounded bg-[#1e293b]" />
    <div className="h-64 w-full rounded bg-[#1e293b]" />
  </div>
);

export default function TransactionsByHourChart({
  data,
  peakHours,
  selectedHour,
  onHourHover,
  loading,
  lastRefresh,
  isMounted,
}: TransactionsByHourChartProps) {
  const peakHourData = peakHours[0];
  const hasPeakTie = peakHours.length > 1;
  const tiedPeakHoursLabel = peakHours.slice(1).map((hour) => hour.hour).join(", ");
  const totalTransactions = data.reduce((sum, point) => sum + point.transactions, 0);
  const avgTransactions = data.length > 0 ? Math.round(totalTransactions / data.length) : 0;
  const selectedHourData =
    Number.isInteger(selectedHour) && selectedHour >= 0 ? data[selectedHour] : undefined;

  const handleMouseMove = (state: MouseMoveState) => {
    const hoveredIndex = state?.activeTooltipIndex;

    if (
      Number.isInteger(hoveredIndex) &&
      hoveredIndex >= 0 &&
      hoveredIndex < data.length &&
      data[hoveredIndex]
    ) {
      onHourHover(hoveredIndex);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--accent-strong)]">
            📈 Transactions by Hour
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            24-hour transaction volume across all markets
            {isMounted && lastRefresh && (
              <span className="ml-2 text-[#60a5fa]">
                Updated at {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        {peakHourData && (
          <div className="rounded-lg bg-[#1e293b] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">
              Peak Hour
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--accent)]">
              {peakHourData.hour}
            </p>
            <p className="text-xs text-[#10b981]">
              {peakHourData.transactions} txns
            </p>
            {hasPeakTie && (
              <p className="text-[10px] text-[var(--muted)]">
                Tie with {tiedPeakHoursLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            onMouseMove={handleMouseMove}
          >
            <defs>
              <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.purpleLine} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.purpleLine} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
              opacity={0.3}
            />

            <XAxis
              dataKey="hour"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              tick={{ fill: "var(--muted)" }}
              interval={2}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              tick={{ fill: "var(--muted)" }}
            />

            {peakHourData && (
              <ReferenceLine
                y={peakHourData.transactions}
                stroke={CHART_COLORS.deepGold}
                strokeDasharray="5 5"
                opacity={0.3}
                label={{
                  value: hasPeakTie ? "Peak (tie)" : "Peak",
                  position: "right",
                  fill: CHART_COLORS.deepGold,
                  fontSize: 11,
                  offset: 10,
                }}
              />
            )}

            {selectedHourData && (
              <ReferenceLine
                x={selectedHourData.hour}
                stroke="#60a5fa"
                strokeDasharray="3 3"
                opacity={0.5}
                label={{
                  value: "Selected",
                  position: "top",
                  fill: "#60a5fa",
                  fontSize: 10,
                  offset: 5,
                }}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="transactions"
              stroke={CHART_COLORS.purpleLine}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{
                r: 6,
                fill: CHART_COLORS.purpleFill,
                stroke: "white",
                strokeWidth: 2,
              }}
              fill="url(#colorTransactions)"
              isAnimationActive
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-[#1e293b] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">
            Total (24h)
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--accent)]">{totalTransactions}</p>
        </div>
        <div className="rounded-lg bg-[#1e293b] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">
            Average/Hour
          </p>
          <p className="mt-1 text-xl font-bold text-[#a855f7]">{avgTransactions}</p>
        </div>
        <div className="rounded-lg bg-[#1e293b] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">
            Next Refresh
          </p>
          <p className="mt-1 text-xs font-semibold text-[#60a5fa]">In ~1 hour</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
        <p className="text-xs text-[var(--muted)]">
          💡{" "}
          {peakHourData && isMounted
            ? `Peak hour is ${peakHourData.hour} with ${peakHourData.transactions} transactions${hasPeakTie ? `, tied with ${tiedPeakHoursLabel}` : ""}. Consider flash sales 30 minutes before peak for maximum engagement.`
            : "Loading insights..."}
        </p>
      </div>
    </div>
  );
}
