import type { HistoricalMonthSummary } from "@/services/monthly-history";

type MonthlyComparisonChartProps = {
  data: HistoricalMonthSummary[];
};

type ChartSeries = {
  key: "salesTotal" | "costsTotal" | "expensesTotal" | "realProfit";
  label: string;
  color: string;
};

const chartSeries: ChartSeries[] = [
  { key: "salesTotal", label: "Ventas", color: "#0d8f65" },
  { key: "costsTotal", label: "Costos", color: "#c7651a" },
  { key: "expensesTotal", label: "Gastos", color: "#b04b2d" },
  { key: "realProfit", label: "Ganancia real", color: "#3d4ecc" },
];

function formatMonthShort(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  return new Intl.DateTimeFormat("es-CL", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function roundValue(value: number) {
  return Math.round(value * 100) / 100;
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const chartData = [...data].reverse();
  const values = chartData.flatMap((month) =>
    chartSeries.map((series) => month[series.key]),
  );

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || 1;

  const chartHeight = 280;
  const chartWidth = Math.max(680, chartData.length * 88);
  const leftPadding = 64;
  const rightPadding = 24;
  const topPadding = 22;
  const bottomPadding = 58;
  const innerWidth = chartWidth - leftPadding - rightPadding;
  const innerHeight = chartHeight - topPadding - bottomPadding;

  const getX = (index: number) => {
    if (chartData.length <= 1) {
      return leftPadding + innerWidth / 2;
    }

    return leftPadding + (index / (chartData.length - 1)) * innerWidth;
  };

  const getY = (value: number) => {
    const ratio = (value - minValue) / range;
    return topPadding + innerHeight - ratio * innerHeight;
  };

  const zeroY = getY(0);
  const gridTicks = 4;
  const gridValues = Array.from({ length: gridTicks + 1 }, (_, index) => {
    const value = minValue + (index / gridTicks) * range;
    return roundValue(value);
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {chartSeries.map((series) => (
          <div
            key={series.key}
            className="rounded-xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: `${series.color}44`, color: series.color }}
          >
            <span
              aria-hidden
              className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 p-2">
        <svg
          role="img"
          aria-label="Comparación mensual de ventas, costos, gastos y ganancia real"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-w-full"
        >
          <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#fdfdff" rx="14" />

          {gridValues.map((value, index) => {
            const y = getY(value);
            return (
              <g key={`grid-${index}`}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={chartWidth - rightPadding}
                  y2={y}
                  stroke="#dde4f0"
                  strokeWidth="1"
                />
                <text
                  x={leftPadding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                >
                  {new Intl.NumberFormat("es-CL", { notation: "compact" }).format(value)}
                </text>
              </g>
            );
          })}

          <line
            x1={leftPadding}
            y1={zeroY}
            x2={chartWidth - rightPadding}
            y2={zeroY}
            stroke="#8b98b2"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {chartSeries.map((series) => {
            const points = chartData.map((month, index) => {
              const x = getX(index);
              const y = getY(month[series.key]);
              return `${x},${y}`;
            });

            return (
              <g key={series.key}>
                <polyline
                  points={points.join(" ")}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {chartData.map((month, index) => {
                  const x = getX(index);
                  const y = getY(month[series.key]);
                  return <circle key={`${series.key}-${month.month}`} cx={x} cy={y} r="3" fill={series.color} />;
                })}
              </g>
            );
          })}

          {chartData.map((month, index) => (
            <text
              key={month.month}
              x={getX(index)}
              y={chartHeight - 22}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {formatMonthShort(month.month)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
