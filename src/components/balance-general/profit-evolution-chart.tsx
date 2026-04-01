import type { GlobalBalanceChartPoint } from "@/services/global-balance";

type ProfitEvolutionChartProps = {
  data: GlobalBalanceChartPoint[];
};

function formatMonthShort(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));

  return new Intl.DateTimeFormat("es-CL", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatCompactValue(value: number) {
  return new Intl.NumberFormat("es-CL", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ProfitEvolutionChart({ data }: ProfitEvolutionChartProps) {
  const values = data.map((item) => item.realProfit);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || 1;

  const chartHeight = 280;
  const chartWidth = Math.max(640, data.length * 88);
  const leftPadding = 66;
  const rightPadding = 24;
  const topPadding = 20;
  const bottomPadding = 56;
  const innerWidth = chartWidth - leftPadding - rightPadding;
  const innerHeight = chartHeight - topPadding - bottomPadding;

  const getX = (index: number) => {
    if (data.length <= 1) {
      return leftPadding + innerWidth / 2;
    }

    return leftPadding + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (value: number) => {
    const ratio = (value - minValue) / range;
    return topPadding + innerHeight - ratio * innerHeight;
  };

  const zeroY = getY(0);
  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, index) => minValue + (index / ticks) * range);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 p-2">
      <svg
        role="img"
        aria-label="Evolución mensual de la ganancia real"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="min-w-full"
      >
        <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#fdfdff" rx="14" />

        {tickValues.map((value, index) => {
          const y = getY(value);

          return (
            <g key={`tick-${index}`}>
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
                {formatCompactValue(value)}
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

        <polyline
          points={data.map((item, index) => `${getX(index)},${getY(item.realProfit)}`).join(" ")}
          fill="none"
          stroke="#3d4ecc"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((item, index) => (
          <circle key={item.month} cx={getX(index)} cy={getY(item.realProfit)} r="3" fill="#3d4ecc" />
        ))}

        {data.map((item, index) => (
          <text
            key={`${item.month}-label`}
            x={getX(index)}
            y={chartHeight - 22}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {formatMonthShort(item.month)}
          </text>
        ))}
      </svg>
    </div>
  );
}
