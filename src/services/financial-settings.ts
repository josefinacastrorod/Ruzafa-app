import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type FinancialSettingRow = Database["public"]["Tables"]["financial_settings"]["Row"];
type FinancialSettingInsert = Database["public"]["Tables"]["financial_settings"]["Insert"];

export type FinancialSettingsFormValues = {
  fixed_amount_to_keep: string;
  withdrawal_percentage: string;
  savings_percentage: string;
  start_date: string;
};

export type FinancialSettingsValidationErrors = {
  fixed_amount_to_keep?: string;
  withdrawal_percentage?: string;
  savings_percentage?: string;
  start_date?: string;
};

export type FinancialSettingInput = {
  fixed_amount_to_keep: number;
  withdrawal_percentage: number;
  savings_percentage: number;
  start_date: string;
};

function formatDateToISO(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthBounds(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    throw new Error("Mes inválido.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error("Mes inválido.");
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    startDate: formatDateToISO(start),
    endDateExclusive: formatDateToISO(end),
  };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

function validatePercentageField(value: string, required: boolean) {
  const parsed = parseOptionalNumber(value);

  if (required && !value.trim()) {
    return "Este campo es obligatorio.";
  }

  if (parsed === null) {
    return undefined;
  }

  if (!Number.isFinite(parsed)) {
    return "Ingresa un número válido.";
  }

  if (parsed < 0 || parsed > 100) {
    return "Debe estar entre 0 y 100.";
  }

  return undefined;
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

export function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function validateFinancialSettingsForm(
  values: FinancialSettingsFormValues,
): FinancialSettingsValidationErrors {
  const errors: FinancialSettingsValidationErrors = {};

  if (!values.start_date) {
    errors.start_date = "La fecha de inicio es obligatoria.";
  }

  const fixedAmount = parseOptionalNumber(values.fixed_amount_to_keep);
  if (!values.fixed_amount_to_keep.trim()) {
    errors.fixed_amount_to_keep = "El monto fijo es obligatorio.";
  } else if (fixedAmount === null || !Number.isFinite(fixedAmount)) {
    errors.fixed_amount_to_keep = "Ingresa un número válido.";
  } else if (fixedAmount < 0) {
    errors.fixed_amount_to_keep = "No puede ser negativo.";
  }

  const withdrawalError = validatePercentageField(values.withdrawal_percentage, true);
  if (withdrawalError) {
    errors.withdrawal_percentage = withdrawalError;
  }

  const savingsError = validatePercentageField(values.savings_percentage, true);
  if (savingsError) {
    errors.savings_percentage = savingsError;
  }

  return errors;
}

export async function listFinancialSettings() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as FinancialSettingRow[];
}

export async function createFinancialSetting(input: FinancialSettingInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const payload: FinancialSettingInsert = {
    user_id: userId,
    fixed_amount_to_keep: input.fixed_amount_to_keep,
    withdrawal_percentage: input.withdrawal_percentage,
    savings_percentage: input.savings_percentage,
    start_date: input.start_date,
  };

  const { data, error } = await supabase
    .from("financial_settings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FinancialSettingRow;
}

export async function getFinancialSettingForMonth(month: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();
  const { endDateExclusive } = getMonthBounds(month);

  const monthEndDate = new Date(`${endDateExclusive}T00:00:00Z`);
  monthEndDate.setUTCDate(monthEndDate.getUTCDate() - 1);
  const selectedMonthLastDay = formatDateToISO(monthEndDate);

  const { data, error } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("user_id", userId)
    .lte("start_date", selectedMonthLastDay)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as FinancialSettingRow | null) ?? null;
}
