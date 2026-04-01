import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type CostRow = Database["public"]["Tables"]["costs"]["Row"];
type CostInsert = Database["public"]["Tables"]["costs"]["Insert"];

type CostFormValues = {
  name: string;
  amount: string;
  date: string;
  category: string;
  note: string;
};

export type CostValidationErrors = {
  name?: string;
  amount?: string;
  date?: string;
};

export type CostInput = {
  name: string;
  amount: number;
  date: string;
  category?: string | null;
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

export function validateCostForm(values: CostFormValues): CostValidationErrors {
  const errors: CostValidationErrors = {};
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

export async function listCostsByMonth(month: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();
  const { startDate, endDateExclusive } = getMonthBounds(month);

  const { data, error } = await supabase
    .from("costs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lt("date", endDateExclusive)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as CostRow[];
}

export async function createCost(input: CostInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const payload: CostInsert = {
    user_id: userId,
    name: input.name.trim(),
    amount: input.amount,
    date: input.date,
    category: input.category?.trim() ? input.category.trim() : null,
    note: input.note?.trim() ? input.note.trim() : null,
  };

  const { data, error } = await supabase
    .from("costs")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CostRow;
}

export async function updateCost(costId: string, input: CostInput) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("costs")
    .update({
      name: input.name.trim(),
      amount: input.amount,
      date: input.date,
      category: input.category?.trim() ? input.category.trim() : null,
      note: input.note?.trim() ? input.note.trim() : null,
    })
    .eq("id", costId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CostRow;
}

export async function deleteCost(costId: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("costs")
    .delete()
    .eq("id", costId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
