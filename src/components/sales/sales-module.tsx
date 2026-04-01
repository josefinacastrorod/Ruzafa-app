"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/types/database";
import {
  createSale,
  deleteSale,
  getCurrentMonthValue,
  getTodayValue,
  listSalesByMonth,
  updateSale,
  validateSaleForm,
  type SaleValidationErrors,
} from "@/services/sales";

type Sale = Database["public"]["Tables"]["sales"]["Row"];

type FormValues = {
  name: string;
  amount: string;
  date: string;
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

export function SalesModule() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<SaleValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  async function loadSales(month: string) {
    setIsLoadingSales(true);

    try {
      const rows = await listSalesByMonth(month);
      setSales(rows);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoadingSales(false);
    }
  }

  useEffect(() => {
    void loadSales(selectedMonth);
  }, [selectedMonth]);

  function resetForm() {
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setEditingSaleId(null);
  }

  function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const errors = validateSaleForm(formValues);

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
        note: formValues.note.trim() || null,
      };

      if (editingSaleId) {
        await updateSale(editingSaleId, payload);
        setFeedback({ type: "success", message: "Venta actualizada con éxito." });
      } else {
        await createSale(payload);
        setFeedback({ type: "success", message: "Venta creada con éxito." });
      }

      resetForm();
      await loadSales(selectedMonth);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(sale: Sale) {
    setEditingSaleId(sale.id);
    setFormValues({
      name: sale.name,
      amount: String(sale.amount),
      date: sale.date,
      note: sale.note ?? "",
    });
    setFormErrors({});
    setFeedback(null);
  }

  async function handleDelete(sale: Sale) {
    const confirmed = window.confirm(`¿Eliminar la venta "${sale.name}"?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingSaleId(sale.id);

    try {
      await deleteSale(sale.id);
      setFeedback({ type: "success", message: "Venta eliminada con éxito." });

      if (editingSaleId === sale.id) {
        resetForm();
      }

      await loadSales(selectedMonth);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setDeletingSaleId(null);
    }
  }

  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Ventas</h1>
        <p className="app-subtitle">
          Registra y gestiona tus ventas mensuales.
        </p>
      </div>

      <div className="app-card p-5">
        <label htmlFor="sales-month" className="app-label">
          Filtrar por mes
        </label>
        <input
          id="sales-month"
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
          {editingSaleId ? "Editar venta" : "Nueva venta"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="sale-name" className="app-label">
              Nombre
            </label>
            <input
              id="sale-name"
              type="text"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: Collar de perlas"
            />
            {formErrors.name && <p className="mt-1 text-sm text-rose-600">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="sale-amount" className="app-label">
              Monto
            </label>
            <input
              id="sale-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={formValues.amount}
              onChange={(event) => handleChange("amount", event.target.value)}
              className="mt-1 app-input"
              placeholder="Ej: 25000"
            />
            {formErrors.amount && (
              <p className="mt-1 text-sm text-rose-600">{formErrors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="sale-date" className="app-label">
              Fecha
            </label>
            <input
              id="sale-date"
              type="date"
              value={formValues.date}
              onChange={(event) => handleChange("date", event.target.value)}
              className="mt-1 app-input"
            />
            {formErrors.date && <p className="mt-1 text-sm text-rose-600">{formErrors.date}</p>}
          </div>

          <div>
            <label htmlFor="sale-note" className="app-label">
              Nota (opcional)
            </label>
            <textarea
              id="sale-note"
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
                ? editingSaleId
                  ? "Guardando cambios..."
                  : "Guardando venta..."
                : editingSaleId
                  ? "Guardar cambios"
                  : "Guardar venta"}
            </button>
            {editingSaleId && (
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
          <h2 className="app-section-title">Listado de ventas</h2>
          <p className="text-sm text-slate-500">Ordenadas por fecha (desc)</p>
        </div>

        {isLoadingSales ? (
          <p className="mt-4 text-sm text-slate-600">Cargando ventas...</p>
        ) : sales.length === 0 ? (
          <div className="mt-4 app-empty">
            No hay ventas registradas para el mes seleccionado.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {sales.map((sale) => (
              <li
                key={sale.id}
                className="app-list-item"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{sale.name}</p>
                    <p className="text-sm text-slate-600">{formatDate(sale.date)}</p>
                    {sale.note && (
                      <p className="mt-2 text-sm text-slate-700">{sale.note}</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-base font-semibold text-slate-900">
                      {formatAmount(sale.amount)}
                    </p>
                    <div className="mt-3 flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(sale)}
                        className="app-btn-secondary px-3 py-1.5 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sale)}
                        disabled={deletingSaleId === sale.id}
                        className="app-btn-danger"
                      >
                        {deletingSaleId === sale.id ? "Eliminando..." : "Eliminar"}
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
