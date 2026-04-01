"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateRealProfit,
  calculateRemainingAfterFixedAmount,
  calculateSuggestedDistribution,
  type MonthlyTotals,
  sumRows,
} from "@/lib/financial-calculations";
import { listCostsByMonth } from "@/services/costs";
import { listExpensesByMonth } from "@/services/expenses";
import { getFinancialSettingForMonth } from "@/services/financial-settings";
import { getCurrentMonthValue, listSalesByMonth } from "@/services/sales";
import type { Database } from "@/types/database";

type FinancialSetting = Database["public"]["Tables"]["financial_settings"]["Row"];

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
  const [setting, setSetting] = useState<FinancialSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadMonthlySummary(month: string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [salesRows, costRows, expenseRows, currentSetting] = await Promise.all([
        listSalesByMonth(month),
        listCostsByMonth(month),
        listExpensesByMonth(month),
        getFinancialSettingForMonth(month),
      ]);

      setTotals({
        sales: sumRows(salesRows),
        costs: sumRows(costRows),
        expenses: sumRows(expenseRows),
      });
      setHasTransactions(salesRows.length > 0 || costRows.length > 0 || expenseRows.length > 0);
      setSetting(currentSetting);
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setTotals({ sales: 0, costs: 0, expenses: 0 });
      setHasTransactions(false);
      setSetting(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMonthlySummary(selectedMonth);
  }, [selectedMonth]);

  const realProfit = useMemo(() => {
    return calculateRealProfit(totals);
  }, [totals]);

  const fixedAmountToKeep = setting?.fixed_amount_to_keep ?? 0;

  const remainingAfterFixedAmount = useMemo(() => {
    return calculateRemainingAfterFixedAmount(realProfit, fixedAmountToKeep);
  }, [fixedAmountToKeep, realProfit]);

  const distribution = useMemo(() => {
    if (!setting) {
      return { suggestedWithdrawal: 0, suggestedSavings: 0 };
    }

    return calculateSuggestedDistribution(
      remainingAfterFixedAmount,
      setting.withdrawal_percentage,
      setting.savings_percentage,
    );
  }, [remainingAfterFixedAmount, setting]);

  const suggestedWithdrawal = distribution.suggestedWithdrawal;
  const suggestedSavings = distribution.suggestedSavings;

  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Resumen mensual</h1>
        <p className="app-subtitle">
          Visualiza el resultado real del mes y aplica la configuración financiera vigente.
        </p>
      </div>

      <div className="app-card p-5">
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

      <div className="app-card p-5">
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

            <div className="grid gap-3">
              <article className="app-metric-card">
                <p className="app-metric-label">Ventas totales</p>
                <p className="app-metric-value">{formatCurrency(totals.sales)}</p>
              </article>
              <article className="app-metric-card">
                <p className="app-metric-label">Costos totales</p>
                <p className="app-metric-value">{formatCurrency(totals.costs)}</p>
              </article>
              <article className="app-metric-card">
                <p className="app-metric-label">Gastos totales</p>
                <p className="app-metric-value">{formatCurrency(totals.expenses)}</p>
              </article>
              <article className="app-metric-card app-metric-highlight">
                <p className="app-metric-label">Ganancia real</p>
                <p className="app-metric-value">{formatCurrency(realProfit)}</p>
              </article>
            </div>

            {realProfit <= 0 && (
              <div className="app-feedback-warning">
                La ganancia real del mes es 0 o negativa, por lo que no hay monto sugerido para
                retiro ni ahorros.
              </div>
            )}

            <div className="grid gap-3">
              <article className="app-metric-card">
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
              <article className="app-metric-card">
                <p className="app-metric-label">Retiro sugerido</p>
                <p className="app-metric-value">
                  {setting ? formatCurrency(suggestedWithdrawal) : "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  % aplicado: {setting ? formatPercentage(setting.withdrawal_percentage) : "-"}
                </p>
              </article>
              <article className="app-metric-card">
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
