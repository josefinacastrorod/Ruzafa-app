"use client";

import { useEffect, useState } from "react";
import { MonthlyComparisonChart } from "@/components/monthly-history/monthly-comparison-chart";
import { listHistoricalMonthlySummary, type HistoricalMonthSummary } from "@/services/monthly-history";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));

  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function toCSVValue(value: string | number | null) {
  if (value === null) {
    return "";
  }

  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

type MonthCardProps = {
  monthSummary: HistoricalMonthSummary;
};

function MonthCard({ monthSummary }: MonthCardProps) {
  return (
    <details className="app-card p-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold capitalize text-slate-900">
            {formatMonthLabel(monthSummary.month)}
          </h3>
          <p className="mt-1 text-xs text-slate-500">Ganancia real: {formatCurrency(monthSummary.realProfit)}</p>
        </div>
        <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          {monthSummary.month}
        </span>
      </summary>

      <div className="mt-4 space-y-3">
        {!monthSummary.hasFinancialSetting && (
          <div className="app-feedback-warning">
            No hay configuración financiera vigente para este mes. El retiro y ahorros sugeridos no
            se pueden calcular.
          </div>
        )}

        {monthSummary.realProfit <= 0 && (
          <div className="app-feedback-warning">
            La ganancia real es 0 o negativa. El restante, retiro sugerido y ahorros sugeridos se
            muestran en 0 cuando hay configuración.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="app-metric-card">
            <p className="app-metric-label">Ventas totales</p>
            <p className="app-metric-value">{formatCurrency(monthSummary.salesTotal)}</p>
          </article>
          <article className="app-metric-card">
            <p className="app-metric-label">Costos totales</p>
            <p className="app-metric-value">{formatCurrency(monthSummary.costsTotal)}</p>
          </article>
          <article className="app-metric-card">
            <p className="app-metric-label">Gastos totales</p>
            <p className="app-metric-value">{formatCurrency(monthSummary.expensesTotal)}</p>
          </article>
          <article className="app-metric-card app-metric-highlight">
            <p className="app-metric-label">Ganancia real</p>
            <p className="app-metric-value">{formatCurrency(monthSummary.realProfit)}</p>
          </article>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="app-metric-card">
            <p className="app-metric-label">Monto fijo guardado</p>
            <p className="app-metric-value">
              {monthSummary.fixedAmountToKeep === null
                ? "Sin configuración"
                : formatCurrency(monthSummary.fixedAmountToKeep)}
            </p>
          </article>
          <article className="app-metric-card">
            <p className="app-metric-label">Restante</p>
            <p className="app-metric-value">
              {monthSummary.remainingAfterFixedAmount === null
                ? "Sin configuración"
                : formatCurrency(monthSummary.remainingAfterFixedAmount)}
            </p>
          </article>
          <article className="app-metric-card">
            <p className="app-metric-label">Retiro sugerido</p>
            <p className="app-metric-value">
              {monthSummary.suggestedWithdrawal === null
                ? "Sin configuración"
                : formatCurrency(monthSummary.suggestedWithdrawal)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              % aplicado:{" "}
              {monthSummary.withdrawalPercentage === null
                ? "-"
                : formatPercentage(monthSummary.withdrawalPercentage)}
            </p>
          </article>
          <article className="app-metric-card">
            <p className="app-metric-label">Ahorros sugeridos</p>
            <p className="app-metric-value">
              {monthSummary.suggestedSavings === null
                ? "Sin configuración"
                : formatCurrency(monthSummary.suggestedSavings)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              % aplicado:{" "}
              {monthSummary.savingsPercentage === null
                ? "-"
                : formatPercentage(monthSummary.savingsPercentage)}
            </p>
          </article>
          <article className="app-metric-card">
            <p className="app-metric-label">Configuración usada</p>
            <p className="app-metric-value">
              {monthSummary.settingStartDate ? formatDate(monthSummary.settingStartDate) : "-"}
            </p>
          </article>
        </div>
      </div>
    </details>
  );
}

export function MonthlyHistoryModule() {
  const [months, setMonths] = useState<HistoricalMonthSummary[]>([]);
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const history = await listHistoricalMonthlySummary();
        setMonths(history);
        if (history.length > 0) {
          setMonthTo(history[0].month);
          setMonthFrom(history[history.length - 1].month);
        }
      } catch (error) {
        setLoadError(getErrorMessage(error));
        setMonths([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadHistory();
  }, []);

  const filteredMonths = months.filter((monthSummary) => {
    if (monthFrom && monthSummary.month < monthFrom) {
      return false;
    }

    if (monthTo && monthSummary.month > monthTo) {
      return false;
    }

    return true;
  });

  function exportCSV() {
    if (filteredMonths.length === 0) {
      return;
    }

    const header = [
      "mes",
      "ventas_totales",
      "costos_totales",
      "gastos_totales",
      "ganancia_real",
      "monto_fijo_guardado",
      "porcentaje_retiro",
      "porcentaje_ahorro",
      "restante",
      "retiro_sugerido",
      "ahorros_sugeridos",
      "fecha_configuracion",
      "tiene_configuracion",
    ];

    const rows = filteredMonths.map((item) => [
      item.month,
      item.salesTotal,
      item.costsTotal,
      item.expensesTotal,
      item.realProfit,
      item.fixedAmountToKeep,
      item.withdrawalPercentage,
      item.savingsPercentage,
      item.remainingAfterFixedAmount,
      item.suggestedWithdrawal,
      item.suggestedSavings,
      item.settingStartDate,
      item.hasFinancialSetting ? "si" : "no",
    ]);

    const content = [header, ...rows]
      .map((row) => row.map((value) => toCSVValue(value)).join(","))
      .join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "historial-financiero.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  const hasInvalidRange = monthFrom && monthTo && monthFrom > monthTo;

  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Historial financiero</h1>
        <p className="app-subtitle">
          Consulta el resumen de cada mes usando las fechas de ventas, costos y gastos. Cada etapa
          mensual queda guardada sin afectar los meses anteriores.
        </p>
      </div>

      {isLoading ? (
        <div className="app-card p-5">
          <p className="text-sm text-slate-600">Cargando historial mensual...</p>
        </div>
      ) : loadError ? (
        <div className="app-card p-5">
          <div className="app-feedback-error">{loadError}</div>
        </div>
      ) : months.length === 0 ? (
        <div className="app-card p-5">
          <div className="app-empty">
            No hay datos para mostrar. Registra al menos una venta, costo o gasto y vuelve a
            revisar el historial.
          </div>
        </div>
      ) : (
        <>
          <div className="app-card p-5">
            <h2 className="app-section-title">Filtros</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="app-label" htmlFor="month-from">
                  Desde
                </label>
                <input
                  id="month-from"
                  type="month"
                  value={monthFrom}
                  onChange={(event) => setMonthFrom(event.target.value)}
                  className="app-input"
                />
              </div>
              <div>
                <label className="app-label" htmlFor="month-to">
                  Hasta
                </label>
                <input
                  id="month-to"
                  type="month"
                  value={monthTo}
                  onChange={(event) => setMonthTo(event.target.value)}
                  className="app-input"
                />
              </div>
            </div>
            {hasInvalidRange && (
              <div className="mt-3 app-feedback-warning">
                El rango de meses no es válido: "desde" debe ser menor o igual a "hasta".
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="app-btn-secondary"
                onClick={exportCSV}
                disabled={hasInvalidRange || filteredMonths.length === 0}
              >
                Exportar CSV
              </button>
              <button
                type="button"
                className="app-btn-secondary"
                onClick={exportPDF}
                disabled={hasInvalidRange || filteredMonths.length === 0}
              >
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="app-card p-5">
            <h2 className="app-section-title">Gráfico comparativo mensual</h2>
            <p className="mt-2 text-sm text-slate-600">
              Comparación por mes de ventas, costos, gastos y ganancia real.
            </p>
            <div className="mt-4">
              <MonthlyComparisonChart data={filteredMonths} />
            </div>
          </div>

          <div className="space-y-3">
            {filteredMonths.length === 0 ? (
              <div className="app-card p-5">
                <div className="app-empty">
                  No hay meses dentro del rango seleccionado.
                </div>
              </div>
            ) : (
              filteredMonths.map((monthSummary) => (
                <MonthCard key={monthSummary.month} monthSummary={monthSummary} />
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
