"use client";

import { useEffect, useMemo, useState } from "react";
import { listCostsByMonth } from "@/services/costs";
import { listExpensesByMonth } from "@/services/expenses";
import { getCurrentMonthValue, listSalesByMonth } from "@/services/sales";

type MonthlyTotals = {
  sales: number;
  costs: number;
  expenses: number;
};

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

  return "Ocurrió un error inesperado.";
}

function sumRows(rows: Array<{ amount: number | null }>) {
  return rows.reduce((total, row) => total + (row.amount ?? 0), 0);
}

function validatePercentage(value: string) {
  if (!value.trim()) {
    return "Ingresa un porcentaje entre 0 y 100.";
  }

  const percentage = Number(value);

  if (!Number.isFinite(percentage)) {
    return "El porcentaje debe ser un número válido.";
  }

  if (percentage < 0 || percentage > 100) {
    return "El porcentaje debe estar entre 0 y 100.";
  }

  return undefined;
}

export function WithdrawalsModule() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [totals, setTotals] = useState<MonthlyTotals>({ sales: 0, costs: 0, expenses: 0 });
  const [percentage, setPercentage] = useState("60");
  const [percentageError, setPercentageError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadMonthlyTotals(month: string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [salesRows, costRows, expenseRows] = await Promise.all([
        listSalesByMonth(month),
        listCostsByMonth(month),
        listExpensesByMonth(month),
      ]);

      setTotals({
        sales: sumRows(salesRows),
        costs: sumRows(costRows),
        expenses: sumRows(expenseRows),
      });
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setTotals({ sales: 0, costs: 0, expenses: 0 });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMonthlyTotals(selectedMonth);
  }, [selectedMonth]);

  const realProfit = useMemo(() => {
    return totals.sales - totals.costs - totals.expenses;
  }, [totals]);

  const parsedPercentage = Number(percentage);
  const isPercentageValid = !validatePercentage(percentage);

  const suggestedWithdrawal =
    realProfit > 0 && isPercentageValid ? realProfit * (parsedPercentage / 100) : 0;

  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Retiros</h1>
        <p className="app-subtitle">
          Calcula el retiro sugerido según ventas, costos y gastos reales del mes.
        </p>
      </div>

      <div className="app-card p-5">
        <label htmlFor="withdrawals-month" className="app-label">
          Mes
        </label>
        <input
          id="withdrawals-month"
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="mt-2 app-input"
        />
      </div>

      <div className="app-card p-5">
        <h2 className="app-section-title">Resumen del mes</h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Cargando datos del mes...</p>
        ) : loadError ? (
          <div className="mt-4 app-feedback-error">
            {loadError}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
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
              <p className="app-metric-label">Ganancia real disponible</p>
              <p className="app-metric-value">{formatCurrency(realProfit)}</p>
            </article>
          </div>
        )}
      </div>

      <div className="app-card p-5">
        <h2 className="app-section-title">Calculadora de retiro</h2>

        <div className="mt-4 space-y-3">
          <label htmlFor="withdrawal-percentage" className="app-label">
            Porcentaje de retiro
          </label>
          <div className="relative">
            <input
              id="withdrawal-percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputMode="decimal"
              value={percentage}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPercentage(nextValue);
                setPercentageError(validatePercentage(nextValue));
              }}
              className="app-input pr-10"
              placeholder="Ej: 60"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              %
            </span>
          </div>

          {percentageError && <p className="text-sm text-rose-600">{percentageError}</p>}

          {isLoading ? (
            <p className="text-sm text-slate-600">Esperando datos del mes para calcular...</p>
          ) : realProfit <= 0 ? (
            <div className="app-feedback-warning">
              No hay monto disponible para retirar este mes porque la ganancia real es 0 o negativa.
            </div>
          ) : percentageError ? (
            <div className="app-feedback-error">
              Corrige el porcentaje para calcular el retiro sugerido.
            </div>
          ) : (
            <div className="app-feedback-success">
              Puedes retirar: <span className="font-semibold">{formatCurrency(suggestedWithdrawal)}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
