import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type SaleRow = Database["public"]["Tables"]["sales"]["Row"];
type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"];

type SaleFormValues = {
  name: string;
  amount: string;
  date: string;
  note: string;
};

export type SaleValidationErrors = {
  name?: string;
  amount?: string;
  date?: string;
};

export type SaleInput = {
  name: string;
  amount: number;
  date: string;
  note?: string | null;
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

export function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function validateSaleForm(values: SaleFormValues): SaleValidationErrors {
  const errors: SaleValidationErrors = {};
  const amount = Number(values.amount);

  if (!values.name.trim()) {
    errors.name = "El nombre es obligatorio.";
  }

  if (!values.amount.trim()) {
    errors.amount = "El monto es obligatorio.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "El monto debe ser mayor a 0.";
  }

  if (!values.date) {
    errors.date = "La fecha es obligatoria.";
  }

  return errors;
}

export async function listSalesByMonth(month: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();
  const { startDate, endDateExclusive } = getMonthBounds(month);

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lt("date", endDateExclusive)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as SaleRow[];
}

export async function createSale(input: SaleInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const payload: SaleInsert = {
    user_id: userId,
    name: input.name.trim(),
    amount: input.amount,
    date: input.date,
    note: input.note?.trim() ? input.note.trim() : null,
  };

  const { data, error } = await supabase
    .from("sales")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SaleRow;
}

export async function updateSale(saleId: string, input: SaleInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("sales")
    .update({
      name: input.name.trim(),
      amount: input.amount,
      date: input.date,
      note: input.note?.trim() ? input.note.trim() : null,
    })
    .eq("id", saleId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SaleRow;
}

export async function deleteSale(saleId: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
