import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardPage() {
  const metrics = [
    { label: "Ventas del mes", value: "-", icon: "sales", tone: "app-metric-sales" },
    { label: "Costos del mes", value: "-", icon: "costs", tone: "app-metric-cost" },
    { label: "Gastos del mes", value: "-", icon: "expenses", tone: "app-metric-expense" },
    { label: "Retiros del mes", value: "-", icon: "withdrawals", tone: "app-metric-saving" },
    { label: "Utilidad estimada", value: "-", icon: "summary", tone: "app-metric-highlight" },
    { label: "Disponible estimado", value: "-", icon: "dashboard", tone: "app-metric-highlight" },
  ] as const;

  return (
    <section className="app-page">
      <PageHeader
        title="Dashboard"
        description="Resumen financiero general del mes actual."
        icon="dashboard"
      />

      <div className="app-grid-3">
        {metrics.map((metric) => (
          <article key={metric.label} className={`app-metric-card ${metric.tone}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="app-metric-label">{metric.label}</p>
              <AppIcon
                name={metric.icon}
                className={`h-4 w-4 ${metric.tone === "app-metric-highlight" ? "text-white/80" : "text-slate-500"}`}
              />
            </div>
            <p className="app-metric-value">{metric.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
