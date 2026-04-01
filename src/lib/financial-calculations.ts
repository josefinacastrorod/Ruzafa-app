export type MonthlyTotals = {
  sales: number;
  costs: number;
  expenses: number;
};

export function sumRows(rows: Array<{ amount: number | null }>) {
  return rows.reduce((total, row) => total + (row.amount ?? 0), 0);
}

export function calculateRealProfit(totals: MonthlyTotals) {
  return totals.sales - totals.costs - totals.expenses;
}

export function calculateRemainingAfterFixedAmount(realProfit: number, fixedAmountToKeep: number) {
  return Math.max(realProfit - fixedAmountToKeep, 0);
}

export function calculateSuggestedDistribution(
  remainingAfterFixedAmount: number,
  withdrawalPercentage: number,
  savingsPercentage: number,
) {
  return {
    suggestedWithdrawal: remainingAfterFixedAmount * (withdrawalPercentage / 100),
    suggestedSavings: remainingAfterFixedAmount * (savingsPercentage / 100),
  };
}
