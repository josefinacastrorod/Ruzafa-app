"use client";

import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";
import { getGlobalBalanceSummary, type GlobalBalanceSummary } from "@/services/global-balance";
import {
  getMonthlyFinancialSummary,
  type MonthlyFinancialSummary,
} from "@/services/monthly-financial-summary";
import { getCurrentMonthValue } from "@/services/sales";

const emptyMonthly: MonthlyFinancialSummary = {
  month: getCurrentMonthValue(),
  totals: { sales: 0, costs: 0, expenses: 0 },
  hasTransactions: false,
  realProfit: 0,
  setting: null,
  fixedAmountToKeep: null,
  remainingAfterFixedAmount: null,
  suggestedWithdrawal: null,
  suggestedSavings: null,
};

const emptyGlobal: GlobalBalanceSummary = {
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatOptionalCurrency(amount: number | null) {
  if (amount === null) {
    return "-";
  }

  return formatCurrency(amount);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado al cargar el dashboard.";
}

export function DashboardModule() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [monthlySummary, setMonthlySummary] = useState<MonthlyFinancialSummary>(emptyMonthly);
  const [globalSummary, setGlobalSummary] = useState<GlobalBalanceSummary>(emptyGlobal);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (month: string) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [nextMonthlySummary, nextGlobalSummary] = await Promise.all([
        getMonthlyFinancialSummary(month),
        getGlobalBalanceSummary(),
      ]);

      setMonthlySummary(nextMonthlySummary);
      setGlobalSummary(nextGlobalSummary);
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setMonthlySummary({
        ...emptyMonthly,
        month,
      });
      setGlobalSummary(emptyGlobal);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(selectedMonth);
  }, [loadDashboard, selectedMonth]);

  const hasHistoricalData = globalSummary.monthsCount > 0;
  const hasSetting = Boolean(monthlySummary.setting);

  return (
    <section className="app-page">
      <PageHeader
        title="Dashboard"
        description="Pantalla principal con resumen del mes seleccionado y balance histórico acumulado."
        icon="dashboard"
      />

      <div className="app-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="dashboard-month" className="app-label">
              Mes seleccionado
            </label>
            <input
              id="dashboard-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-2 app-input"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(selectedMonth)}
            className="app-btn-secondary sm:self-auto"
            disabled={isLoading}
          >
            {isLoading ? "Actualizando..." : "Actualizar datos"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="app-card p-5">
          <p className="text-sm text-slate-600">Cargando dashboard...</p>
        </div>
      ) : loadError ? (
        <div className="app-card p-5">
          <div className="app-feedback-error">{loadError}</div>
        </div>
      ) : (
        <>
          <div className="app-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="app-section-title">Resumen del mes</h2>
                <p className="app-panel-subtitle">
                  Cálculo real del mes seleccionado usando la configuración vigente para ese mes.
                </p>
              </div>
              <span className="app-soft-badge">{selectedMonth}</span>
            </div>

            <div className="mt-4 space-y-3">
              {!monthlySummary.hasTransactions && (
                <div className="app-empty">
                  No hay ventas, costos ni gastos registrados para este mes.
                </div>
              )}

              {!hasSetting && (
                <div className="app-feedback-warning">
                  No existe configuración financiera vigente para este mes. El monto fijo, restante,
                  retiro sugerido y ahorros sugeridos se muestran sin cálculo.
                </div>
              )}

              {monthlySummary.realProfit <= 0 && (
                <div className="app-feedback-warning">
                  La ganancia real del mes es 0 o negativa; retiro y ahorro sugeridos quedan en 0
                  cuando hay configuración vigente.
                </div>
              )}
            </div>

            <div className="mt-4 app-grid-4">
              <article className="app-metric-card app-metric-sales">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Ventas del mes</p>
                  <AppIcon name="sales" className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="app-metric-value">{formatCurrency(monthlySummary.totals.sales)}</p>
              </article>

              <article className="app-metric-card app-metric-cost">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Costos del mes</p>
                  <AppIcon name="costs" className="h-4 w-4 text-amber-700" />
                </div>
                <p className="app-metric-value">{formatCurrency(monthlySummary.totals.costs)}</p>
              </article>

              <article className="app-metric-card app-metric-expense">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Gastos del mes</p>
                  <AppIcon name="expenses" className="h-4 w-4 text-orange-700" />
                </div>
                <p className="app-metric-value">{formatCurrency(monthlySummary.totals.expenses)}</p>
              </article>

              <article className="app-metric-card app-metric-highlight">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Ganancia real del mes</p>
                  <AppIcon name="summary" className="h-4 w-4 text-white/80" />
                </div>
                <p className="app-metric-value">{formatCurrency(monthlySummary.realProfit)}</p>
              </article>

              <article className="app-metric-card app-metric-saving">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Monto fijo a guardar</p>
                  <AppIcon name="history" className="h-4 w-4 text-indigo-700" />
                </div>
                <p className="app-metric-value">
                  {formatOptionalCurrency(monthlySummary.fixedAmountToKeep)}
                </p>
              </article>

              <article className="app-metric-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Restante después del monto fijo</p>
                  <AppIcon name="dashboard" className="h-4 w-4 text-slate-700" />
                </div>
                <p className="app-metric-value">
                  {formatOptionalCurrency(monthlySummary.remainingAfterFixedAmount)}
                </p>
              </article>

              <article className="app-metric-card app-metric-highlight">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Retiro sugerido del mes</p>
                  <AppIcon name="withdrawals" className="h-4 w-4 text-white/80" />
                </div>
                <p className="app-metric-value">
                  {formatOptionalCurrency(monthlySummary.suggestedWithdrawal)}
                </p>
              </article>

              <article className="app-metric-card app-metric-saving">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Ahorros sugeridos del mes</p>
                  <AppIcon name="summary" className="h-4 w-4 text-indigo-700" />
                </div>
                <p className="app-metric-value">
                  {formatOptionalCurrency(monthlySummary.suggestedSavings)}
                </p>
              </article>
            </div>
          </div>

          <div className="app-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="app-section-title">Acumulados históricos</h2>
                <p className="app-panel-subtitle">
                  Totales calculados por historial mensual aplicando la configuración vigente en
                  cada mes.
                </p>
              </div>
              <span className="app-soft-badge">{globalSummary.monthsCount} mes(es)</span>
            </div>

            {!hasHistoricalData ? (
              <div className="mt-4 app-empty">
                No hay historial suficiente para calcular acumulados. Registra ventas, costos o
                gastos para comenzar.
              </div>
            ) : (
              <>
                {globalSummary.monthsWithoutFinancialSetting > 0 && (
                  <div className="mt-4 app-feedback-warning">
                    Hay {globalSummary.monthsWithoutFinancialSetting} mes(es) sin configuración
                    financiera. En esos meses, ahorro y retiro acumulados se computan en 0 para no
                    inventar reglas.
                  </div>
                )}

                <div className="mt-4 app-grid-3">
                  <article className="app-metric-card app-metric-sales">
                    <p className="app-metric-label">Ventas acumuladas</p>
                    <p className="app-metric-value">{formatCurrency(globalSummary.totals.salesTotal)}</p>
                  </article>

                  <article className="app-metric-card app-metric-cost">
                    <p className="app-metric-label">Costos acumulados</p>
                    <p className="app-metric-value">{formatCurrency(globalSummary.totals.costsTotal)}</p>
                  </article>

                  <article className="app-metric-card app-metric-expense">
                    <p className="app-metric-label">Gastos acumulados</p>
                    <p className="app-metric-value">{formatCurrency(globalSummary.totals.expensesTotal)}</p>
                  </article>

                  <article className="app-metric-card app-metric-highlight">
                    <p className="app-metric-label">Ganancia acumulada</p>
                    <p className="app-metric-value">
                      {formatCurrency(globalSummary.totals.realProfitTotal)}
                    </p>
                  </article>

                  <article className="app-metric-card app-metric-saving">
                    <p className="app-metric-label">Ahorro acumulado</p>
                    <p className="app-metric-value">
                      {formatCurrency(globalSummary.totals.accumulatedSavings)}
                    </p>
                  </article>

                  <article className="app-metric-card">
                    <p className="app-metric-label">Retiro acumulado</p>
                    <p className="app-metric-value">
                      {formatCurrency(globalSummary.totals.accumulatedWithdrawal)}
                    </p>
                  </article>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
