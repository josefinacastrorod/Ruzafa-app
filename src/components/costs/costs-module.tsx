"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";
import type { Database } from "@/types/database";
import {
  createCost,
  deleteCost,
  getCurrentMonthValue,
  getTodayValue,
  listCostsByMonth,
  updateCost,
  validateCostForm,
  type CostValidationErrors,
} from "@/services/costs";

type Cost = Database["public"]["Tables"]["costs"]["Row"];

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

export function CostsModule() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<CostValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [isLoadingCosts, setIsLoadingCosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCostId, setDeletingCostId] = useState<string | null>(null);

  async function loadCosts(month: string) {
    setIsLoadingCosts(true);

    try {
      const rows = await listCostsByMonth(month);
      setCosts(rows);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoadingCosts(false);
    }
  }

  useEffect(() => {
    void loadCosts(selectedMonth);
  }, [selectedMonth]);

  function resetForm() {
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setEditingCostId(null);
  }

  function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const errors = validateCostForm(formValues);

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

      if (editingCostId) {
        await updateCost(editingCostId, payload);
        setFeedback({ type: "success", message: "Costo actualizado con éxito." });
      } else {
        await createCost(payload);
        setFeedback({ type: "success", message: "Costo creado con éxito." });
      }

      resetForm();
      await loadCosts(selectedMonth);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(cost: Cost) {
    setEditingCostId(cost.id);
    setFormValues({
      name: cost.name,
      amount: String(cost.amount),
      date: cost.date,
      category: cost.category ?? "",
      note: cost.note ?? "",
    });
    setFormErrors({});
    setFeedback(null);
  }

  async function handleDelete(cost: Cost) {
    const confirmed = window.confirm(`¿Eliminar el costo "${cost.name}"?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingCostId(cost.id);

    try {
      await deleteCost(cost.id);
      setFeedback({ type: "success", message: "Costo eliminado con éxito." });

      if (editingCostId === cost.id) {
        resetForm();
      }

      await loadCosts(selectedMonth);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setDeletingCostId(null);
    }
  }

  return (
    <section className="app-page">
      <PageHeader
        title="Costos"
        description="Registra y gestiona tus costos mensuales."
        icon="costs"
      />

      <div className="app-card p-5 sm:p-6">
        <label htmlFor="costs-month" className="app-label">
          Filtrar por mes
        </label>
        <input
          id="costs-month"
          type="month"
          value={selectedMonth}
          onChange={(event) => {
            setSelectedMonth(event.target.value);
            setFeedback(null);
          }}
          className="mt-2 app-input"
        />
      </div>

      <div className="app-card p-5 sm:p-6">
        <h2 className="app-section-title">
          {editingCostId ? "Editar costo" : "Nuevo costo"}
        </h2>
        <p className="app-panel-subtitle">
          Registra costos directos y clasifícalos para revisar mejor la estructura mensual.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="cost-name" className="app-label">
              Nombre
            </label>
            <input
              id="cost-name"
              type="text"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: Compra de cadena"
            />
            {formErrors.name && <p className="mt-1 text-sm text-rose-600">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="cost-amount" className="app-label">
              Monto
            </label>
            <input
              id="cost-amount"
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
            <label htmlFor="cost-date" className="app-label">
              Fecha
            </label>
            <input
              id="cost-date"
              type="date"
              value={formValues.date}
              onChange={(event) => handleChange("date", event.target.value)}
              className="mt-1 app-input"
            />
            {formErrors.date && <p className="mt-1 text-sm text-rose-600">{formErrors.date}</p>}
          </div>

          <div>
            <label htmlFor="cost-category" className="app-label">
              Categoría (opcional)
            </label>
            <input
              id="cost-category"
              type="text"
              value={formValues.category}
              onChange={(event) => handleChange("category", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: Materiales"
            />
          </div>

          <div>
            <label htmlFor="cost-note" className="app-label">
              Nota (opcional)
            </label>
            <textarea
              id="cost-note"
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
                ? editingCostId
                  ? "Guardando cambios..."
                  : "Guardando costo..."
                : editingCostId
                  ? "Guardar cambios"
                  : "Guardar costo"}
            </button>
            {editingCostId && (
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

      <div className="app-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="app-section-title">Listado de costos</h2>
          <p className="text-sm text-slate-500">Ordenados por fecha (desc)</p>
        </div>

        {isLoadingCosts ? (
          <p className="mt-4 text-sm text-slate-600">Cargando costos...</p>
        ) : costs.length === 0 ? (
          <div className="mt-4 app-empty">
            No hay costos registrados para el mes seleccionado.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {costs.map((cost) => (
              <li
                key={cost.id}
                className="app-list-item"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <AppIcon name="costs" className="h-4 w-4 text-amber-700" />
                      <p className="font-semibold text-slate-900">{cost.name}</p>
                    </div>
                    <p className="text-sm text-slate-600">{formatDate(cost.date)}</p>
                    {cost.category && (
                      <p className="mt-1 text-sm text-slate-700">
                        Categoría: {cost.category}
                      </p>
                    )}
                    {cost.note && (
                      <p className="mt-2 text-sm text-slate-700">{cost.note}</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-lg font-bold text-amber-700">
                      {formatAmount(cost.amount)}
                    </p>
                    <div className="mt-3 flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(cost)}
                        className="app-btn-secondary px-3 py-1.5 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cost)}
                        disabled={deletingCostId === cost.id}
                        className="app-btn-danger"
                      >
                        {deletingCostId === cost.id ? "Eliminando..." : "Eliminar"}
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
