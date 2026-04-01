"use client";

import { useEffect, useMemo, useState } from "react";
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function findBestProfitMonth(months: HistoricalMonthSummary[]) {
  return months.reduce<HistoricalMonthSummary | null>((best, current) => {
    if (!best || current.realProfit > best.realProfit) {
      return current;
    }

    return best;
  }, null);
}

function findWorstProfitMonth(months: HistoricalMonthSummary[]) {
  return months.reduce<HistoricalMonthSummary | null>((worst, current) => {
    if (!worst || current.realProfit < worst.realProfit) {
      return current;
    }

    return worst;
  }, null);
}

export function AssistantModule() {
  const [months, setMonths] = useState<HistoricalMonthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const history = await listHistoricalMonthlySummary();
        setMonths(history);
      } catch (error) {
        setLoadError(getErrorMessage(error));
        setMonths([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const totals = useMemo(() => {
    return months.reduce(
      (acc, month) => {
        return {
          sales: acc.sales + month.salesTotal,
          costs: acc.costs + month.costsTotal,
          expenses: acc.expenses + month.expensesTotal,
          realProfit: acc.realProfit + month.realProfit,
        };
      },
      { sales: 0, costs: 0, expenses: 0, realProfit: 0 },
    );
  }, [months]);

  const bestMonth = useMemo(() => findBestProfitMonth(months), [months]);
  const worstMonth = useMemo(() => findWorstProfitMonth(months), [months]);
  const monthsWithoutSettings = months.filter((month) => !month.hasFinancialSetting);

  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Asistente interno</h1>
        <p className="app-subtitle">
          Análisis automático usando solo datos internos del historial mensual (sin IA externa).
        </p>
      </div>

      {isLoading ? (
        <div className="app-card p-5">
          <p className="text-sm text-slate-600">Cargando análisis...</p>
        </div>
      ) : loadError ? (
        <div className="app-card p-5">
          <div className="app-feedback-error">{loadError}</div>
        </div>
      ) : months.length === 0 ? (
        <div className="app-card p-5">
          <div className="app-empty">
            No hay suficientes datos para analizar. Registra movimientos y luego revisa esta
            sección.
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            <article className="app-metric-card">
              <p className="app-metric-label">Ventas acumuladas</p>
              <p className="app-metric-value">{formatCurrency(totals.sales)}</p>
            </article>
            <article className="app-metric-card">
              <p className="app-metric-label">Costos acumulados</p>
              <p className="app-metric-value">{formatCurrency(totals.costs)}</p>
            </article>
            <article className="app-metric-card">
              <p className="app-metric-label">Gastos acumulados</p>
              <p className="app-metric-value">{formatCurrency(totals.expenses)}</p>
            </article>
            <article className="app-metric-card app-metric-highlight">
              <p className="app-metric-label">Ganancia real acumulada</p>
              <p className="app-metric-value">{formatCurrency(totals.realProfit)}</p>
            </article>
          </div>

          <div className="app-card p-5">
            <h2 className="app-section-title">Lectura del historial</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {bestMonth && (
                <p>
                  Mejor mes por ganancia real:{" "}
                  <span className="font-semibold capitalize">{formatMonthLabel(bestMonth.month)}</span>{" "}
                  con <span className="font-semibold">{formatCurrency(bestMonth.realProfit)}</span>.
                </p>
              )}
              {worstMonth && (
                <p>
                  Mes más débil por ganancia real:{" "}
                  <span className="font-semibold capitalize">{formatMonthLabel(worstMonth.month)}</span>{" "}
                  con <span className="font-semibold">{formatCurrency(worstMonth.realProfit)}</span>.
                </p>
              )}
              <p>
                Meses analizados: <span className="font-semibold">{months.length}</span>.
              </p>
            </div>
          </div>

          <div className="app-card p-5">
            <h2 className="app-section-title">Alertas de configuración</h2>
            {monthsWithoutSettings.length === 0 ? (
              <div className="mt-4 app-feedback-success">
                Todos los meses con movimientos tienen configuración financiera vigente.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="app-feedback-warning">
                  Hay {monthsWithoutSettings.length} mes(es) sin configuración vigente.
                </div>
                <ul className="space-y-2">
                  {monthsWithoutSettings.map((month) => (
                    <li key={month.month} className="app-list-item text-sm capitalize">
                      {formatMonthLabel(month.month)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
