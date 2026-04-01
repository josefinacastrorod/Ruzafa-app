"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/types/database";
import {
  createExpense,
  deleteExpense,
  getCurrentMonthValue,
  getTodayValue,
  listExpensesByMonth,
  updateExpense,
  validateExpenseForm,
  type ExpenseValidationErrors,
} from "@/services/expenses";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

type FormValues = {
  name: string;
  amount: string;
  date: string;
  category: string;
  note: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

const INITIAL_FORM: FormValues = {
  name: "",
  amount: "",
  date: getTodayValue(),
  category: "",
  note: "",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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

export function ExpensesModule() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<ExpenseValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  async function loadExpenses(month: string) {
    setIsLoadingExpenses(true);

    try {
      const rows = await listExpensesByMonth(month);
      setExpenses(rows);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoadingExpenses(false);
    }
  }

  useEffect(() => {
    void loadExpenses(selectedMonth);
  }, [selectedMonth]);

  function resetForm() {
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setEditingExpenseId(null);
  }

  function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const errors = validateExpenseForm(formValues);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        amount: Number(formValues.amount),
        date: formValues.date,
        category: formValues.category.trim() || null,
        note: formValues.note.trim() || null,
      };

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        setFeedback({ type: "success", message: "Gasto actualizado con éxito." });
      } else {
        await createExpense(payload);
        setFeedback({ type: "success", message: "Gasto creado con éxito." });
      }

      resetForm();
      await loadExpenses(selectedMonth);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(expense: Expense) {
    setEditingExpenseId(expense.id);
    setFormValues({
      name: expense.name,
      amount: String(expense.amount),
      date: expense.date,
      category: expense.category ?? "",
      note: expense.note ?? "",
    });
    setFormErrors({});
    setFeedback(null);
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(`¿Eliminar el gasto "${expense.name}"?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingExpenseId(expense.id);

    try {
      await deleteExpense(expense.id);
      setFeedback({ type: "success", message: "Gasto eliminado con éxito." });

      if (editingExpenseId === expense.id) {
        resetForm();
      }

      await loadExpenses(selectedMonth);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setDeletingExpenseId(null);
    }
  }

  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Gastos</h1>
        <p className="app-subtitle">
          Registra y gestiona tus gastos mensuales.
        </p>
      </div>

      <div className="app-card p-5">
        <label htmlFor="expenses-month" className="app-label">
          Filtrar por mes
        </label>
        <input
          id="expenses-month"
          type="month"
          value={selectedMonth}
          onChange={(event) => {
            setSelectedMonth(event.target.value);
            setFeedback(null);
          }}
          className="mt-2 app-input"
        />
      </div>

      <div className="app-card p-5">
        <h2 className="app-section-title">
          {editingExpenseId ? "Editar gasto" : "Nuevo gasto"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="expense-name" className="app-label">
              Nombre
            </label>
            <input
              id="expense-name"
              type="text"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: Compra de cadena"
            />
            {formErrors.name && <p className="mt-1 text-sm text-rose-600">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="expense-amount" className="app-label">
              Monto
            </label>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={formValues.amount}
              onChange={(event) => handleChange("amount", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: 12000"
            />
            {formErrors.amount && (
              <p className="mt-1 text-sm text-rose-600">{formErrors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="expense-date" className="app-label">
              Fecha
            </label>
            <input
              id="expense-date"
              type="date"
              value={formValues.date}
              onChange={(event) => handleChange("date", event.target.value)}
              className="mt-1 app-input"
            />
            {formErrors.date && <p className="mt-1 text-sm text-rose-600">{formErrors.date}</p>}
          </div>

          <div>
            <label htmlFor="expense-category" className="app-label">
              Categoría (opcional)
            </label>
            <input
              id="expense-category"
              type="text"
              value={formValues.category}
              onChange={(event) => handleChange("category", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: Materiales"
            />
          </div>

          <div>
            <label htmlFor="expense-note" className="app-label">
              Nota (opcional)
            </label>
            <textarea
              id="expense-note"
              value={formValues.note}
              onChange={(event) => handleChange("note", event.target.value)}
              className="mt-1 app-input app-textarea"
              placeholder="Detalle opcional"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="app-btn-primary"
            >
              {isSubmitting
                ? editingExpenseId
                  ? "Guardando cambios..."
                  : "Guardando gasto..."
                : editingExpenseId
                  ? "Guardar cambios"
                  : "Guardar gasto"}
            </button>
            {editingExpenseId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="app-btn-secondary"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      {feedback && (
        <div
          className={feedback.type === "success" ? "app-feedback-success" : "app-feedback-error"}
        >
          {feedback.message}
        </div>
      )}

      <div className="app-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="app-section-title">Listado de gastos</h2>
          <p className="text-sm text-slate-500">Ordenados por fecha (desc)</p>
        </div>

        {isLoadingExpenses ? (
          <p className="mt-4 text-sm text-slate-600">Cargando gastos...</p>
        ) : expenses.length === 0 ? (
          <div className="mt-4 app-empty">
            No hay gastos registrados para el mes seleccionado.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="app-list-item"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{expense.name}</p>
                    <p className="text-sm text-slate-600">{formatDate(expense.date)}</p>
                    {expense.category && (
                      <p className="mt-1 text-sm text-slate-700">
                        Categoría: {expense.category}
                      </p>
                    )}
                    {expense.note && (
                      <p className="mt-2 text-sm text-slate-700">{expense.note}</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-base font-semibold text-slate-900">
                      {formatAmount(expense.amount)}
                    </p>
                    <div className="mt-3 flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(expense)}
                        className="app-btn-secondary px-3 py-1.5 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(expense)}
                        disabled={deletingExpenseId === expense.id}
                        className="app-btn-danger"
                      >
                        {deletingExpenseId === expense.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
