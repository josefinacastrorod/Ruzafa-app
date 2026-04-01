"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";
import { ProfitEvolutionChart } from "@/components/balance-general/profit-evolution-chart";
import { getGlobalBalanceSummary, type GlobalBalanceSummary } from "@/services/global-balance";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado al cargar el balance general.";
}

const emptySummary: GlobalBalanceSummary = {
  totals: {
    salesTotal: 0,
    costsTotal: 0,
    expensesTotal: 0,
    realProfitTotal: 0,
    accumulatedSavings: 0,
    accumulatedWithdrawal: 0,
  },
  chart: [],
  monthsCount: 0,
  monthsWithoutFinancialSetting: 0,
};

export function BalanceGeneralModule() {
  const [summary, setSummary] = useState<GlobalBalanceSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextSummary = await getGlobalBalanceSummary();
        setSummary(nextSummary);
      } catch (error) {
        setLoadError(getErrorMessage(error));
        setSummary(emptySummary);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSummary();
  }, []);

  const hasData = summary.monthsCount > 0;

  return (
    <section className="app-page">
      <PageHeader
        title="Balance general"
        description="Revisa el estado acumulado del negocio considerando todo el historial mensual."
        icon="summary"
      />

      {isLoading ? (
        <div className="app-card p-5">
          <p className="text-sm text-slate-600">Cargando balance general...</p>
        </div>
      ) : loadError ? (
        <div className="app-card p-5">
          <div className="app-feedback-error">{loadError}</div>
        </div>
      ) : !hasData ? (
        <div className="app-card p-5">
          <div className="app-empty">
            No hay datos históricos para mostrar. Registra ventas, costos o gastos para calcular el
            balance general.
          </div>
        </div>
      ) : (
        <>
          {summary.monthsWithoutFinancialSetting > 0 && (
            <div className="app-card p-5">
              <div className="app-feedback-warning">
                Hay {summary.monthsWithoutFinancialSetting} mes(es) sin configuración financiera.
                Esos meses aportan a ventas/costos/gastos/ganancia, pero retiro y ahorro acumulado
                se calculan en 0 para esos casos.
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <article className="app-metric-card app-metric-sales">
              <div className="flex items-center justify-between gap-2">
                <p className="app-metric-label">Ventas totales</p>
                <AppIcon name="sales" className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="app-metric-value">{formatCurrency(summary.totals.salesTotal)}</p>
            </article>

            <article className="app-metric-card app-metric-cost">
              <div className="flex items-center justify-between gap-2">
                <p className="app-metric-label">Costos totales</p>
                <AppIcon name="costs" className="h-4 w-4 text-amber-700" />
              </div>
              <p className="app-metric-value">{formatCurrency(summary.totals.costsTotal)}</p>
            </article>

            <article className="app-metric-card app-metric-expense">
              <div className="flex items-center justify-between gap-2">
                <p className="app-metric-label">Gastos totales</p>
                <AppIcon name="expenses" className="h-4 w-4 text-orange-700" />
              </div>
              <p className="app-metric-value">{formatCurrency(summary.totals.expensesTotal)}</p>
            </article>

            <article className="app-metric-card app-metric-highlight">
              <div className="flex items-center justify-between gap-2">
                <p className="app-metric-label">Ganancia total</p>
                <AppIcon name="summary" className="h-4 w-4 text-white/80" />
              </div>
              <p className="app-metric-value">{formatCurrency(summary.totals.realProfitTotal)}</p>
            </article>

            <article className="app-metric-card app-metric-saving">
              <div className="flex items-center justify-between gap-2">
                <p className="app-metric-label">Ahorro acumulado</p>
                <AppIcon name="history" className="h-4 w-4 text-indigo-700" />
              </div>
              <p className="app-metric-value">{formatCurrency(summary.totals.accumulatedSavings)}</p>
            </article>

            <article className="app-metric-card">
              <div className="flex items-center justify-between gap-2">
                <p className="app-metric-label">Retiro acumulado</p>
                <AppIcon name="withdrawals" className="h-4 w-4 text-slate-700" />
              </div>
              <p className="app-metric-value">{formatCurrency(summary.totals.accumulatedWithdrawal)}</p>
            </article>
          </div>

          <div className="app-card p-5 sm:p-6">
            <h2 className="app-section-title">Evolución de ganancia por mes</h2>
            <p className="mt-1 text-xs text-slate-500">
              Se muestra la ganancia real mensual (ventas - costos - gastos) en orden cronológico.
            </p>
            <div className="mt-4">
              <ProfitEvolutionChart data={summary.chart} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
