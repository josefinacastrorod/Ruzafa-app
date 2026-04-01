import { listHistoricalMonthlySummary, type HistoricalMonthSummary } from "@/services/monthly-history";

export type GlobalBalanceTotals = {
  salesTotal: number;
  costsTotal: number;
  expensesTotal: number;
  realProfitTotal: number;
  accumulatedSavings: number;
  accumulatedWithdrawal: number;
};

export type GlobalBalanceChartPoint = {
  month: string;
  realProfit: number;
};

export type GlobalBalanceSummary = {
  totals: GlobalBalanceTotals;
  chart: GlobalBalanceChartPoint[];
  monthsCount: number;
  monthsWithoutFinancialSetting: number;
};

function sumNullable(values: Array<number | null>) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function toChartPoints(monthly: HistoricalMonthSummary[]) {
  return [...monthly]
    .reverse()
    .map((month) => ({
      month: month.month,
      realProfit: month.realProfit,
    }));
}

export async function getGlobalBalanceSummary(): Promise<GlobalBalanceSummary> {
  const monthly = await listHistoricalMonthlySummary();

  const totals: GlobalBalanceTotals = {
    salesTotal: monthly.reduce((total, month) => total + month.salesTotal, 0),
    costsTotal: monthly.reduce((total, month) => total + month.costsTotal, 0),
    expensesTotal: monthly.reduce((total, month) => total + month.expensesTotal, 0),
    realProfitTotal: monthly.reduce((total, month) => total + month.realProfit, 0),
    accumulatedSavings: sumNullable(monthly.map((month) => month.suggestedSavings)),
    accumulatedWithdrawal: sumNullable(monthly.map((month) => month.suggestedWithdrawal)),
  };

  return {
    totals,
    chart: toChartPoints(monthly),
    monthsCount: monthly.length,
    monthsWithoutFinancialSetting: monthly.filter((month) => !month.hasFinancialSetting).length,
  };
}
