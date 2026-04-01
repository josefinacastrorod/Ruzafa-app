import { calculateRealProfit, calculateRemainingAfterFixedAmount, calculateSuggestedDistribution } from "@/lib/financial-calculations";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type SalesRow = Pick<Database["public"]["Tables"]["sales"]["Row"], "amount" | "date">;
type CostsRow = Pick<Database["public"]["Tables"]["costs"]["Row"], "amount" | "date">;
type ExpensesRow = Pick<Database["public"]["Tables"]["expenses"]["Row"], "amount" | "date">;
type FinancialSettingRow = Database["public"]["Tables"]["financial_settings"]["Row"];

export type HistoricalMonthSummary = {
  month: string;
  salesTotal: number;
  costsTotal: number;
  expensesTotal: number;
  realProfit: number;
  fixedAmountToKeep: number | null;
  withdrawalPercentage: number | null;
  savingsPercentage: number | null;
  remainingAfterFixedAmount: number | null;
  suggestedWithdrawal: number | null;
  suggestedSavings: number | null;
  settingStartDate: string | null;
  hasFinancialSetting: boolean;
};

function getErrorMessage(error: { message: string } | null) {
  return error?.message ?? "Ocurrió un error inesperado al cargar el historial.";
}

async function getAuthenticatedUserId() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  return user.id;
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getMonthLastDay(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDayDate = new Date(Date.UTC(year, monthNumber, 0));
  const monthPart = String(lastDayDate.getUTCMonth() + 1).padStart(2, "0");
  const dayPart = String(lastDayDate.getUTCDate()).padStart(2, "0");
  return `${lastDayDate.getUTCFullYear()}-${monthPart}-${dayPart}`;
}

function sumByMonth<T extends { amount: number | null; date: string }>(rows: T[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const month = getMonthKey(row.date);
    const current = map.get(month) ?? 0;
    map.set(month, current + (row.amount ?? 0));
  }

  return map;
}

function getSettingForMonth(settings: FinancialSettingRow[], month: string) {
  const monthLastDay = getMonthLastDay(month);
  return settings.find((setting) => setting.start_date <= monthLastDay) ?? null;
}

export async function listHistoricalMonthlySummary() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const [salesResponse, costsResponse, expensesResponse, settingsResponse] = await Promise.all([
    supabase
      .from("sales")
      .select("amount, date")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("costs")
      .select("amount, date")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("expenses")
      .select("amount, date")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("financial_settings")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (salesResponse.error) {
    throw new Error(getErrorMessage(salesResponse.error));
  }

  if (costsResponse.error) {
    throw new Error(getErrorMessage(costsResponse.error));
  }

  if (expensesResponse.error) {
    throw new Error(getErrorMessage(expensesResponse.error));
  }

  if (settingsResponse.error) {
    throw new Error(getErrorMessage(settingsResponse.error));
  }

  const salesRows = (salesResponse.data ?? []) as SalesRow[];
  const costsRows = (costsResponse.data ?? []) as CostsRow[];
  const expensesRows = (expensesResponse.data ?? []) as ExpensesRow[];
  const settings = (settingsResponse.data ?? []) as FinancialSettingRow[];

  const salesByMonth = sumByMonth(salesRows);
  const costsByMonth = sumByMonth(costsRows);
  const expensesByMonth = sumByMonth(expensesRows);

  const allMonths = new Set<string>([
    ...Array.from(salesByMonth.keys()),
    ...Array.from(costsByMonth.keys()),
    ...Array.from(expensesByMonth.keys()),
  ]);

  const sortedMonths = Array.from(allMonths).sort((a, b) => b.localeCompare(a));

  return sortedMonths.map<HistoricalMonthSummary>((month) => {
    const salesTotal = salesByMonth.get(month) ?? 0;
    const costsTotal = costsByMonth.get(month) ?? 0;
    const expensesTotal = expensesByMonth.get(month) ?? 0;
    const realProfit = calculateRealProfit({
      sales: salesTotal,
      costs: costsTotal,
      expenses: expensesTotal,
    });

    const setting = getSettingForMonth(settings, month);

    if (!setting) {
      return {
        month,
        salesTotal,
        costsTotal,
        expensesTotal,
        realProfit,
        fixedAmountToKeep: null,
        withdrawalPercentage: null,
        savingsPercentage: null,
        remainingAfterFixedAmount: null,
        suggestedWithdrawal: null,
        suggestedSavings: null,
        settingStartDate: null,
        hasFinancialSetting: false,
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
      salesTotal,
      costsTotal,
      expensesTotal,
      realProfit,
      fixedAmountToKeep: setting.fixed_amount_to_keep,
      withdrawalPercentage: setting.withdrawal_percentage,
      savingsPercentage: setting.savings_percentage,
      remainingAfterFixedAmount,
      suggestedWithdrawal,
      suggestedSavings,
      settingStartDate: setting.start_date,
      hasFinancialSetting: true,
    };
  });
}
