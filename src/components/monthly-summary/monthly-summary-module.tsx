"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";
import { type MonthlyTotals } from "@/lib/financial-calculations";
import {
  getMonthlyFinancialSummary,
  type MonthlyFinancialSummary,
} from "@/services/monthly-financial-summary";
import { getCurrentMonthValue } from "@/services/sales";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

export function MonthlySummaryModule() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [totals, setTotals] = useState<MonthlyTotals>({ sales: 0, costs: 0, expenses: 0 });
  const [hasTransactions, setHasTransactions] = useState(false);
  const [summary, setSummary] = useState<MonthlyFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadMonthlySummary(month: string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextSummary = await getMonthlyFinancialSummary(month);
      setSummary(nextSummary);
      setTotals(nextSummary.totals);
      setHasTransactions(nextSummary.hasTransactions);
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setSummary(null);
      setTotals({ sales: 0, costs: 0, expenses: 0 });
      setHasTransactions(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMonthlySummary(selectedMonth);
  }, [selectedMonth]);

  const realProfit = summary?.realProfit ?? 0;
  const remainingAfterFixedAmount = summary?.remainingAfterFixedAmount ?? 0;
  const suggestedWithdrawal = summary?.suggestedWithdrawal ?? 0;
  const suggestedSavings = summary?.suggestedSavings ?? 0;
  const setting = summary?.setting ?? null;

  return (
    <section className="app-page">
      <PageHeader
        title="Resumen mensual"
        description="Visualiza el resultado real del mes y aplica la configuración financiera vigente."
        icon="summary"
      />

      <div className="app-card p-5 sm:p-6">
        <label htmlFor="summary-month" className="app-label">
          Mes
        </label>
        <input
          id="summary-month"
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="mt-2 app-input"
        />
      </div>

      <div className="app-card p-5 sm:p-6">
        <h2 className="app-section-title">Detalle del mes</h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Cargando resumen del mes...</p>
        ) : loadError ? (
          <div className="mt-4 app-feedback-error">
            {loadError}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!hasTransactions && (
              <div className="app-empty">
                No hay ventas, costos ni gastos registrados para este mes.
              </div>
            )}

            {!setting && (
              <div className="app-feedback-warning">
                No existe una configuración financiera vigente para el mes seleccionado. Crea una
                configuración con fecha de inicio menor o igual al mes que quieres resumir.
              </div>
            )}

            <div className="app-grid-4">
              <article className="app-metric-card app-metric-sales">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Ventas totales</p>
                  <AppIcon name="sales" className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="app-metric-value">{formatCurrency(totals.sales)}</p>
              </article>
              <article className="app-metric-card app-metric-cost">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Costos totales</p>
                  <AppIcon name="costs" className="h-4 w-4 text-amber-700" />
                </div>
                <p className="app-metric-value">{formatCurrency(totals.costs)}</p>
              </article>
              <article className="app-metric-card app-metric-expense">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Gastos totales</p>
                  <AppIcon name="expenses" className="h-4 w-4 text-orange-700" />
                </div>
                <p className="app-metric-value">{formatCurrency(totals.expenses)}</p>
              </article>
              <article className="app-metric-card app-metric-highlight">
                <div className="flex items-center justify-between gap-2">
                  <p className="app-metric-label">Ganancia real</p>
                  <AppIcon name="summary" className="h-4 w-4 text-white/80" />
                </div>
                <p className="app-metric-value">{formatCurrency(realProfit)}</p>
              </article>
            </div>

            {realProfit <= 0 && (
              <div className="app-feedback-warning">
                La ganancia real del mes es 0 o negativa, por lo que no hay monto sugerido para
                retiro ni ahorros.
              </div>
            )}

            <div className="app-grid-3">
              <article className="app-metric-card app-metric-saving">
                <p className="app-metric-label">Monto fijo a guardar</p>
                <p className="app-metric-value">
                  {setting ? formatCurrency(setting.fixed_amount_to_keep) : "-"}
                </p>
              </article>
              <article className="app-metric-card">
                <p className="app-metric-label">Restante después del monto fijo</p>
                <p className="app-metric-value">
                  {setting ? formatCurrency(remainingAfterFixedAmount) : "-"}
                </p>
              </article>
              <article className="app-metric-card app-metric-highlight">
                <p className="app-metric-label">Retiro sugerido</p>
                <p className="app-metric-value">
                  {setting ? formatCurrency(suggestedWithdrawal) : "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  % aplicado: {setting ? formatPercentage(setting.withdrawal_percentage) : "-"}
                </p>
              </article>
              <article className="app-metric-card app-metric-saving">
                <p className="app-metric-label">Ahorros sugeridos</p>
                <p className="app-metric-value">
                  {setting ? formatCurrency(suggestedSavings) : "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  % aplicado: {setting ? formatPercentage(setting.savings_percentage) : "-"}
                </p>
              </article>
              <article className="app-metric-card">
                <p className="app-metric-label">Configuración usada</p>
                <p className="app-metric-value">
                  {setting ? formatDate(setting.start_date) : "-"}
                </p>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
