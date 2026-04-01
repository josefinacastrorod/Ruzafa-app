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
import { listSalesByMonth } from "@/services/sales";
import type { Database } from "@/types/database";

type FinancialSettingRow = Database["public"]["Tables"]["financial_settings"]["Row"];

export type MonthlyFinancialSummary = {
  month: string;
  totals: MonthlyTotals;
  hasTransactions: boolean;
  realProfit: number;
  setting: FinancialSettingRow | null;
  fixedAmountToKeep: number | null;
  remainingAfterFixedAmount: number | null;
  suggestedWithdrawal: number | null;
  suggestedSavings: number | null;
};

export async function getMonthlyFinancialSummary(month: string): Promise<MonthlyFinancialSummary> {
  const [salesRows, costRows, expenseRows, setting] = await Promise.all([
    listSalesByMonth(month),
    listCostsByMonth(month),
    listExpensesByMonth(month),
    getFinancialSettingForMonth(month),
  ]);

  const totals: MonthlyTotals = {
    sales: sumRows(salesRows),
    costs: sumRows(costRows),
    expenses: sumRows(expenseRows),
  };

  const realProfit = calculateRealProfit(totals);
  const hasTransactions = salesRows.length > 0 || costRows.length > 0 || expenseRows.length > 0;

  if (!setting) {
    return {
      month,
      totals,
      hasTransactions,
      realProfit,
      setting: null,
      fixedAmountToKeep: null,
      remainingAfterFixedAmount: null,
      suggestedWithdrawal: null,
      suggestedSavings: null,
    };
  }

  const remainingAfterFixedAmount = calculateRemainingAfterFixedAmount(
    realProfit,
    setting.fixed_amount_to_keep,
  );
  const { suggestedWithdrawal, suggestedSavings } = calculateSuggestedDistribution(
    remainingAfterFixedAmount,
    setting.withdrawal_percentage,
    setting.savings_percentage,
  );

  return {
    month,
    totals,
    hasTransactions,
    realProfit,
    setting,
    fixedAmountToKeep: setting.fixed_amount_to_keep,
    remainingAfterFixedAmount,
    suggestedWithdrawal,
    suggestedSavings,
  };
}
